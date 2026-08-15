import { db } from "@/db";
import { vehicles } from "@/db/schema/vehicles";
import { apartments } from "@/db/schema/residential";
import { eq, and, isNull, count } from "drizzle-orm";
import type { NewVehicle } from "@/db/schema/vehicles";

// ─── OBTENER VEHÍCULOS POR APARTAMENTO ────────────────────────────────────────
export async function getVehiclesByApartment(tenantId: string, apartmentId: string) {
  return await db.query.vehicles.findMany({
    where: and(
      eq(vehicles.tenantId, tenantId),
      eq(vehicles.apartmentId, apartmentId),
      isNull(vehicles.deletedAt),
    ),
    with: {
      apartment: {
        with: { block: true },
      },
    },
    orderBy: [vehicles.createdAt],
  });
}

// ─── OBTENER TODOS LOS VEHÍCULOS DE UN CONJUNTO ───────────────────────────────
export async function getAllVehicles(tenantId: string, complexId: string) {
  return await db.query.vehicles.findMany({
    where: and(
      eq(vehicles.tenantId, tenantId),
      eq(vehicles.complexId, complexId),
      isNull(vehicles.deletedAt),
    ),
    with: {
      apartment: {
        with: { block: true },
      },
    },
    orderBy: [vehicles.createdAt],
  });
}

// ─── CREAR VEHÍCULO ───────────────────────────────────────────────────────────
/**
 * Crea un vehículo validando que el apartamento no exceda el límite de maxVehicles.
 */
export async function createVehicle(tenantId: string, data: NewVehicle) {
  // 1. Verificar el apartamento y su límite
  const apartment = await db.query.apartments.findFirst({
    where: and(
      eq(apartments.id, data.apartmentId),
      eq(apartments.tenantId, tenantId),
    ),
  });

  if (!apartment) {
    throw new Error("El apartamento no existe o no pertenece a este conjunto.");
  }

  // 2. Contar vehículos activos registrados en ese apartamento
  const [{ count: vehicleCount }] = await db
    .select({ count: count() })
    .from(vehicles)
    .where(and(
      eq(vehicles.apartmentId, data.apartmentId),
      eq(vehicles.tenantId, tenantId),
      isNull(vehicles.deletedAt),
    ));

  if (Number(vehicleCount) >= apartment.maxVehicles) {
    throw new Error(
      `El Apartamento ${apartment.number} ya tiene ${apartment.maxVehicles} vehículo(s) registrado(s). ` +
      `No se pueden registrar más vehículos.`
    );
  }

  // 3. Crear el vehículo
  const [vehicle] = await db.insert(vehicles).values({
    ...data,
    tenantId,
    placa: data.placa.trim().toUpperCase(),
  }).returning();

  return vehicle;
}

// ─── ACTUALIZAR VEHÍCULO ──────────────────────────────────────────────────────
export async function updateVehicle(
  tenantId: string,
  vehicleId: string,
  data: Partial<NewVehicle>,
) {
  const [updated] = await db
    .update(vehicles)
    .set({
      ...data,
      placa: data.placa?.trim().toUpperCase(),
      updatedAt: new Date(),
    })
    .where(and(
      eq(vehicles.id, vehicleId),
      eq(vehicles.tenantId, tenantId),
      isNull(vehicles.deletedAt),
    ))
    .returning();

  if (!updated) {
    throw new Error("El vehículo no fue encontrado o no tiene permisos para editarlo.");
  }

  return updated;
}

// ─── ELIMINAR VEHÍCULO (SOFT DELETE) ─────────────────────────────────────────
export async function deleteVehicle(
  tenantId: string,
  vehicleId: string,
  reason?: string,
) {
  const [deleted] = await db
    .update(vehicles)
    .set({
      deletedAt: new Date(),
      status: "inactive",
      cancellationReason: reason ?? "Eliminado por el administrador",
      updatedAt: new Date(),
    })
    .where(and(
      eq(vehicles.id, vehicleId),
      eq(vehicles.tenantId, tenantId),
      isNull(vehicles.deletedAt),
    ))
    .returning();

  if (!deleted) {
    throw new Error("El vehículo no fue encontrado.");
  }

  return deleted;
}
