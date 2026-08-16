import { db } from "@/db";
import { tenants } from "@/db/schema/tenants";
import { residentialComplexes, blocks, apartments } from "@/db/schema/residential";
import { vehicles } from "@/db/schema/vehicles";
import { eq, and, isNull } from "drizzle-orm";

export async function getPublicComplexData(tenantSlug: string) {
  // Obtener tenant y complex asociado
  const tenant = await db.query.tenants.findFirst({
    where: and(eq(tenants.slug, tenantSlug), eq(tenants.active, true), isNull(tenants.deletedAt)),
  });

  if (!tenant) return null;

  const complex = await db.query.residentialComplexes.findFirst({
    where: and(eq(residentialComplexes.tenantId, tenant.id), isNull(residentialComplexes.deletedAt)),
  });

  if (!complex) return null;

  // Cargar bloques y apartamentos de forma segura (sin datos sensibles)
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
        },
      },
    },
  });

  const publicPassword = (tenant.config as any)?.publicRegistrationPassword;

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    complexId: complex.id,
    complexName: complex.name,
    blocks: blocksData,
    hasPassword: !!publicPassword,
  };
}

export async function checkApartmentVehicleLimit(tenantId: string, apartmentId: string) {
  // Obtener el límite del apartamento
  const apt = await db.query.apartments.findFirst({
    where: and(eq(apartments.id, apartmentId), eq(apartments.tenantId, tenantId)),
    columns: { maxVehicles: true },
  });

  if (!apt) return { allowed: false, error: "Apartamento no encontrado" };

  // Contar vehículos activos en el apartamento
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
      error: `Este apartamento ya ha registrado el máximo de vehículos permitidos (${apt.maxVehicles}).` 
    };
  }

  return { allowed: true };
}
