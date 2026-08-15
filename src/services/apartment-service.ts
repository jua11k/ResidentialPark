import { db } from "@/db";
import { apartments, blocks, residentialComplexes } from "@/db/schema/residential";
import { eq, and, isNull } from "drizzle-orm";
import type { NewApartment } from "@/db/schema/residential";

// ─── OBTENER BLOQUES DE UN CONJUNTO ───────────────────────────────────────────
export async function getBlocksByComplex(tenantId: string, complexId: string) {
  return await db.query.blocks.findMany({
    where: and(
      eq(blocks.tenantId, tenantId),
      eq(blocks.complexId, complexId),
      isNull(blocks.deletedAt),
    ),
    with: {
      apartments: {
        where: isNull(apartments.deletedAt),
        with: {
          // Carga vehículos activos por apartamento para mostrar ocupación
        },
        orderBy: [apartments.number],
      },
    },
    orderBy: [blocks.name],
  });
}

// ─── OBTENER APARTAMENTOS DE UN BLOQUE ────────────────────────────────────────
export async function getApartmentsByBlock(tenantId: string, blockId: string) {
  return await db.query.apartments.findMany({
    where: and(
      eq(apartments.tenantId, tenantId),
      eq(apartments.blockId, blockId),
      isNull(apartments.deletedAt),
    ),
    orderBy: [apartments.number],
  });
}

// ─── OBTENER CONJUNTO POR SLUG DE TENANT ──────────────────────────────────────
export async function getComplexByTenantSlug(tenantId: string) {
  return await db.query.residentialComplexes.findFirst({
    where: and(
      eq(residentialComplexes.tenantId, tenantId),
      isNull(residentialComplexes.deletedAt),
      eq(residentialComplexes.status, "active"),
    ),
    with: {
      blocks: {
        where: isNull(blocks.deletedAt),
        with: {
          apartments: {
            where: isNull(apartments.deletedAt),
          },
        },
      },
    },
  });
}

// ─── CREAR APARTAMENTO ────────────────────────────────────────────────────────
export async function createApartment(tenantId: string, data: NewApartment) {
  const [apt] = await db.insert(apartments).values({
    ...data,
    tenantId,
  }).returning();
  return apt;
}

// ─── ACTUALIZAR APARTAMENTO ───────────────────────────────────────────────────
export async function updateApartment(
  tenantId: string,
  apartmentId: string,
  data: Partial<NewApartment>,
) {
  const [updated] = await db
    .update(apartments)
    .set({ ...data, updatedAt: new Date() })
    .where(and(
      eq(apartments.id, apartmentId),
      eq(apartments.tenantId, tenantId),
      isNull(apartments.deletedAt),
    ))
    .returning();
  return updated;
}

export type BulkConfig = 
  | { type: "floor-based"; floors: number; unitsPerFloor: number; unitDigits?: number }
  | { type: "sequential"; totalUnits: number };

export async function createBulkApartments(
  tenantId: string,
  complexId: string,
  blockNames: string[],
  config: BulkConfig,
  maxVehicles: number = 2
) {
  try {
    return await db.transaction(async (tx) => {
      let createdBlocks = 0;
      let createdApartments = 0;

      for (const blockName of blockNames) {
        const existingBlocks = await tx
          .select()
          .from(blocks)
          .where(
            and(
              eq(blocks.tenantId, tenantId),
              eq(blocks.complexId, complexId),
              eq(blocks.name, blockName)
            )
          );

        let blockId: string;
        if (existingBlocks.length > 0) {
          blockId = existingBlocks[0].id;
        } else {
          const [newBlock] = await tx
            .insert(blocks)
            .values({
              tenantId,
              complexId,
              name: blockName,
              totalFloors: config.type === "floor-based" ? config.floors : null,
            })
            .returning({ id: blocks.id });
          blockId = newBlock.id;
          createdBlocks++;
        }

        const apartmentNumbers: string[] = [];
        if (config.type === "floor-based") {
          const digits = config.unitDigits || 2;
          for (let f = 1; f <= config.floors; f++) {
            for (let u = 1; u <= config.unitsPerFloor; u++) {
              const unitNum = String(u).padStart(digits, '0');
              apartmentNumbers.push(`${f}${unitNum}`);
            }
          }
        } else if (config.type === "sequential") {
          for (let u = 1; u <= config.totalUnits; u++) {
            apartmentNumbers.push(`${u}`);
          }
        }

        const existingApts = await tx
          .select({ number: apartments.number })
          .from(apartments)
          .where(
            and(
              eq(apartments.tenantId, tenantId),
              eq(apartments.blockId, blockId)
            )
          );
        const existingNumbers = new Set(existingApts.map((a) => a.number));
        const toCreate = apartmentNumbers.filter((num) => !existingNumbers.has(num));

        if (toCreate.length > 0) {
          const insertData = toCreate.map((num) => ({
            tenantId,
            complexId,
            blockId,
            number: num,
            floor: config.type === "floor-based" ? parseInt(num.slice(0, -(config.unitDigits || 2))) || 1 : null,
            maxVehicles,
          }));
          await tx.insert(apartments).values(insertData);
          createdApartments += toCreate.length;
        }
      }

      return { success: true, data: { createdBlocks, createdApartments } };
    });
  } catch (error: any) {
    console.error("[createBulkApartments] Error:", error);
    return { success: false, error: error.message || "Error al crear configuración masiva." };
  }
}
