import { db } from "@/db";
import { parkingRecords } from "@/db/schema/parking";
import { vehicles } from "@/db/schema/vehicles";
import { apartments } from "@/db/schema/residential";
import { eq, and, desc, isNull, ilike, or, sql } from "drizzle-orm";

// ─── BÚSQUEDA AVANZADA PARA LA PORTERÍA ──────────────────────────────────────

export async function getVehiclesByApartment(tenantId: string, apartmentId: string) {
  const result = await db
    .select({
      vehicle: vehicles,
      isInside: sql<boolean>`CASE WHEN ${parkingRecords.id} IS NOT NULL THEN true ELSE false END`,
    })
    .from(vehicles)
    .leftJoin(
      parkingRecords,
      and(
        eq(parkingRecords.vehicleId, vehicles.id),
        eq(parkingRecords.status, "inside")
      )
    )
    .where(
      and(
        eq(vehicles.tenantId, tenantId),
        eq(vehicles.apartmentId, apartmentId),
        isNull(vehicles.deletedAt)
      )
    );

  // Parsear resultados para incluir `apartment` (que ya sabemos por el ID, pero la estructura lo espera)
  // Obtenemos info básica del apartamento para el UI.
  const aptInfo = await db.query.apartments.findFirst({
    where: eq(apartments.id, apartmentId),
    with: { block: true }
  });

  return result.map(r => ({
    ...r.vehicle,
    isInside: r.isInside,
    apartment: aptInfo,
  }));
}

export async function searchVehicles(tenantId: string, query: string) {
  const result = await db
    .select({
      vehicle: vehicles,
      apartment: apartments,
      isInside: sql<boolean>`CASE WHEN ${parkingRecords.id} IS NOT NULL THEN true ELSE false END`,
    })
    .from(vehicles)
    .leftJoin(apartments, eq(vehicles.apartmentId, apartments.id))
    .leftJoin(
      parkingRecords,
      and(
        eq(parkingRecords.vehicleId, vehicles.id),
        eq(parkingRecords.status, "inside")
      )
    )
    .where(
      and(
        eq(vehicles.tenantId, tenantId),
        isNull(vehicles.deletedAt),
        or(
          ilike(vehicles.placa, `%${query}%`),
          ilike(vehicles.ownerName, `%${query}%`)
        )
      )
    )
    .limit(20);

  // Como no hicimos join con `blocks` para simplificar, lo estructuramos así
  return result.map(r => ({
    ...r.vehicle,
    isInside: r.isInside,
    apartment: r.apartment ? {
      ...r.apartment,
      // Nota: blocks no viene, podemos omitirlo si no se muestra en el dropdown, o hacer otro join
    } : null,
  }));
}

// ─── BÚSQUEDA DE VEHÍCULO POR PLACA ───────────────────────────────────────────
/**
 * Busca un vehículo por placa dentro del tenant.
 * Retorna el vehículo con datos del apartamento y bloque.
 */
export async function getVehicleByPlaca(tenantId: string, placa: string) {
  return await db.query.vehicles.findFirst({
    where: and(
      eq(vehicles.tenantId, tenantId),
      eq(vehicles.placa, placa.trim().toUpperCase()),
      isNull(vehicles.deletedAt),
    ),
    with: {
      apartment: {
        with: {
          block: true,
        },
      },
    },
  });
}

// ─── VEHÍCULOS ACTUALMENTE DENTRO ─────────────────────────────────────────────
/**
 * Lista todos los vehículos actualmente dentro del parqueadero de un conjunto.
 */
export async function getActiveParking(tenantId: string, complexId: string) {
  return await db.query.parkingRecords.findMany({
    where: and(
      eq(parkingRecords.tenantId, tenantId),
      eq(parkingRecords.complexId, complexId),
      eq(parkingRecords.status, "inside"),
    ),
    with: {
      vehicle: {
        with: {
          apartment: {
            with: {
              block: true,
            },
          },
        },
      },
    },
    orderBy: [desc(parkingRecords.entryTime)],
  });
}

// ─── REGISTRAR INGRESO ────────────────────────────────────────────────────────
/**
 * Registra el ingreso de un vehículo al parqueadero.
 * Valida:
 *   1. Que el vehículo exista y esté registrado
 *   2. Que el vehículo no esté ya adentro
 *   3. Que el parqueadero del apartamento esté libre (parking_occupied = false)
 */
export async function registerEntry(
  tenantId: string,
  complexId: string,
  vehicleId: string,
  registeredBy?: string,
  observations?: string,
): Promise<typeof parkingRecords.$inferSelect> {
  // 1. Cargar vehículo con datos del apartamento
  const vehicle = await db.query.vehicles.findFirst({
    where: and(
      eq(vehicles.id, vehicleId),
      eq(vehicles.tenantId, tenantId),
      isNull(vehicles.deletedAt),
    ),
    with: { apartment: true },
  });

  if (!vehicle) {
    throw new Error("El vehículo no existe o no pertenece a este conjunto.");
  }

  // 2. Verificar que el vehículo no esté ya adentro
  const existingRecord = await db.query.parkingRecords.findFirst({
    where: and(
      eq(parkingRecords.vehicleId, vehicleId),
      eq(parkingRecords.tenantId, tenantId),
      eq(parkingRecords.status, "inside"),
    ),
  });

  if (existingRecord) {
    throw new Error(`El vehículo con placa ${vehicle.placa} ya se encuentra dentro del parqueadero.`);
  }

  // 3. Verificar que el parqueadero del apartamento esté libre (O(1) con flag)
  const apartment = vehicle.apartment;
  if (apartment.parkingOccupied) {
    throw new Error(
      `El parqueadero del Apartamento ${apartment.number} ya está ocupado. ` +
      `Debe salir el otro vehículo registrado antes de que pueda ingresar.`
    );
  }

  // 4. Crear el registro de ingreso (transacción atómica)
  const [record] = await db.insert(parkingRecords).values({
    tenantId,
    complexId,
    vehicleId,
    apartmentId: vehicle.apartmentId,
    registeredBy: registeredBy ?? null,
    status: "inside",
    observations: observations ?? null,
  }).returning();

  // 5. Marcar el parqueadero del apartamento como ocupado
  await db
    .update(apartments)
    .set({ parkingOccupied: true, updatedAt: new Date() })
    .where(eq(apartments.id, vehicle.apartmentId));

  return record;
}

// ─── REGISTRAR SALIDA ─────────────────────────────────────────────────────────
/**
 * Registra la salida de un vehículo del parqueadero por placa.
 */
export async function registerExit(
  tenantId: string,
  placa: string,
  registeredBy?: string,
): Promise<typeof parkingRecords.$inferSelect> {
  // 1. Buscar vehículo por placa
  const vehicle = await db.query.vehicles.findFirst({
    where: and(
      eq(vehicles.tenantId, tenantId),
      eq(vehicles.placa, placa.trim().toUpperCase()),
      isNull(vehicles.deletedAt),
    ),
  });

  if (!vehicle) {
    throw new Error(`No se encontró un vehículo con la placa ${placa.toUpperCase()}.`);
  }

  // 2. Buscar el registro activo
  const activeRecord = await db.query.parkingRecords.findFirst({
    where: and(
      eq(parkingRecords.vehicleId, vehicle.id),
      eq(parkingRecords.tenantId, tenantId),
      eq(parkingRecords.status, "inside"),
    ),
  });

  if (!activeRecord) {
    throw new Error(`No hay un ingreso activo para la placa ${placa.toUpperCase()}.`);
  }

  const exitTime = new Date();

  // 3. Actualizar el registro con la hora de salida
  const [updatedRecord] = await db
    .update(parkingRecords)
    .set({
      exitTime,
      status: "completed",
      registeredBy: registeredBy ?? activeRecord.registeredBy,
      updatedAt: exitTime,
    })
    .where(eq(parkingRecords.id, activeRecord.id))
    .returning();

  // 4. Liberar el parqueadero del apartamento
  await db
    .update(apartments)
    .set({ parkingOccupied: false, updatedAt: exitTime })
    .where(eq(apartments.id, vehicle.apartmentId));

  return updatedRecord;
}

// ─── HISTORIAL ────────────────────────────────────────────────────────────────
export async function getParkingHistory(
  tenantId: string,
  complexId: string,
  limit = 100,
  offset = 0,
) {
  return await db.query.parkingRecords.findMany({
    where: and(
      eq(parkingRecords.tenantId, tenantId),
      eq(parkingRecords.complexId, complexId),
    ),
    with: {
      vehicle: {
        with: {
          apartment: {
            with: { block: true },
          },
        },
      },
      registeredByUser: true,
    },
    orderBy: [desc(parkingRecords.entryTime)],
    limit,
    offset,
  });
}
