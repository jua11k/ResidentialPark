import { db } from "@/db";
import { tenants } from "@/db/schema/tenants";
import { residentialComplexes, blocks, apartments } from "@/db/schema/residential";
import { vehicles } from "@/db/schema/vehicles";
import { parkingRecords } from "@/db/schema/parking";
import { eq, and, isNull, count, inArray } from "drizzle-orm";

export async function getPublicComplexData(tenantSlug: string) {
  const tenant = await db.query.tenants.findFirst({
    where: and(eq(tenants.slug, tenantSlug), eq(tenants.active, true), isNull(tenants.deletedAt)),
  });
  if (!tenant) return null;

  const complex = await db.query.residentialComplexes.findFirst({
    where: and(eq(residentialComplexes.tenantId, tenant.id), isNull(residentialComplexes.deletedAt)),
  });
  if (!complex) return null;

  // Cargar bloques y apartamentos (sin datos sensibles)
  const blocksData = await db.query.blocks.findMany({
    where: and(eq(blocks.complexId, complex.id), isNull(blocks.deletedAt)),
    orderBy: [blocks.name],
    with: {
      apartments: {
        where: isNull(apartments.deletedAt),
        orderBy: [apartments.number],
        columns: {
          id: true,
          number: true,
          maxVehicles: true,
          accessBlocked: true,
          blockReason: true,
        },
      },
    },
  });

  // Contar vehículos actualmente adentro por tipo para calcular disponibilidad
  const activeRecords = await db
    .select({ vehicleId: parkingRecords.vehicleId })
    .from(parkingRecords)
    .where(and(eq(parkingRecords.tenantId, tenant.id), eq(parkingRecords.status, "inside")));

  let carOccupied = 0;
  let motoOccupied = 0;
  let bikeOccupied = 0;

  if (activeRecords.length > 0) {
    const activeVehicleIds = activeRecords.map((r) => r.vehicleId);
    const activeVehicles = await db.query.vehicles.findMany({
      where: inArray(vehicles.id, activeVehicleIds),
      columns: { tipo: true },
    });
    for (const v of activeVehicles) {
      if (v.tipo === "carro" || v.tipo === "camioneta") carOccupied++;
      else if (v.tipo === "moto") motoOccupied++;
      else if (v.tipo === "bicicleta") bikeOccupied++;
    }
  }

  const carTotal = complex.carParkingSpots;
  const motoTotal = complex.motoParkingSpots;
  const bikeTotal = complex.bikeParkingSpots;

  // Cuando el campo es null, el límite equivale al nro total de apartamentos
  const totalApartments = blocksData.reduce((sum, b) => sum + b.apartments.length, 0);
  const effectiveCarTotal  = carTotal  ?? totalApartments;
  const effectiveMotoTotal = motoTotal ?? totalApartments;
  const effectiveBikeTotal = bikeTotal ?? totalApartments;

  const publicPassword = (tenant.config as any)?.publicRegistrationPassword;

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    complexId: complex.id,
    complexName: complex.name,
    blocks: blocksData,
    hasPassword: !!publicPassword,
    parking: {
      car:  { total: effectiveCarTotal,  occupied: carOccupied,  available: Math.max(0, effectiveCarTotal  - carOccupied)  },
      moto: { total: effectiveMotoTotal, occupied: motoOccupied, available: Math.max(0, effectiveMotoTotal - motoOccupied) },
      bike: { total: effectiveBikeTotal, occupied: bikeOccupied, available: Math.max(0, effectiveBikeTotal - bikeOccupied) },
    },
  };
}

export async function checkApartmentVehicleLimit(tenantId: string, apartmentId: string) {
  const apt = await db.query.apartments.findFirst({
    where: and(eq(apartments.id, apartmentId), eq(apartments.tenantId, tenantId)),
    columns: { maxVehicles: true, accessBlocked: true, blockReason: true },
  });

  if (!apt) return { allowed: false, error: "Apartamento no encontrado" };

  // Verificar bloqueo primero
  if (apt.accessBlocked) {
    return {
      allowed: false,
      error: apt.blockReason
        ? `Este apartamento tiene el acceso restringido: ${apt.blockReason}.`
        : "Este apartamento tiene el acceso restringido. Comuníquese con la administración.",
      blocked: true,
    };
  }

  const currentVehicles = await db.select().from(vehicles).where(
    and(
      eq(vehicles.apartmentId, apartmentId),
      eq(vehicles.tenantId, tenantId),
      eq(vehicles.status, "active"),
      isNull(vehicles.deletedAt)
    )
  );

  if (currentVehicles.length >= apt.maxVehicles) {
    return {
      allowed: false,
      error: `Este apartamento ya ha registrado el máximo de vehículos permitidos (${apt.maxVehicles}).`,
    };
  }

  return { allowed: true };
}
