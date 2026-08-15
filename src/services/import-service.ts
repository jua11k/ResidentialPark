import { db } from "@/db";
import { vehicles } from "@/db/schema/vehicles";
import { apartments, blocks, residentialComplexes } from "@/db/schema/residential";
import { importLogs } from "@/db/schema/audit";
import { eq, and, isNull, count } from "drizzle-orm";

export interface XlsxRow {
  placa: string;
  tipo: string;
  propietario: string;
  apartamento: string;
  bloque: string;
  telefono?: string;
  email?: string;
}

export interface ImportResult {
  success: number;
  errors: { row: number; placa: string; reason: string }[];
}

/**
 * Importa vehículos desde un array de filas parseadas del XLSX.
 * Formato: Placa | Vehículo | Propietario | Apartamento | Bloque | Teléfono | Email
 */
export async function importVehiclesFromXlsx(
  tenantId: string,
  complexId: string,
  rows: XlsxRow[],
  fileName: string,
  importedBy?: string,
): Promise<ImportResult> {
  const result: ImportResult = { success: 0, errors: [] };

  // Precargar bloques del conjunto para búsqueda O(1)
  const complexBlocks = await db.query.blocks.findMany({
    where: and(
      eq(blocks.tenantId, tenantId),
      eq(blocks.complexId, complexId),
      isNull(blocks.deletedAt),
    ),
  });
  const blockMap = new Map(complexBlocks.map((b) => [b.name.toLowerCase().trim(), b]));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // Fila 1 = headers

    try {
      // ─── Validaciones básicas ───────────────────────────────────────────────
      const placa = row.placa?.toString().trim().toUpperCase();
      if (!placa) {
        result.errors.push({ row: rowNum, placa: "-", reason: "La placa está vacía" });
        continue;
      }

      const tipo = row.tipo?.toString().trim().toLowerCase() || "carro";
      const tiposValidos = ["carro", "moto", "camioneta", "bicicleta"];
      const tipoFinal = tiposValidos.includes(tipo) ? tipo : "carro";

      const blockName = row.bloque?.toString().trim();
      if (!blockName) {
        result.errors.push({ row: rowNum, placa, reason: "El bloque está vacío" });
        continue;
      }

      const aptNumber = row.apartamento?.toString().trim();
      if (!aptNumber) {
        result.errors.push({ row: rowNum, placa, reason: "El apartamento está vacío" });
        continue;
      }

      // ─── Buscar o crear bloque ───────────────────────────────────────────────
      let block = blockMap.get(blockName.toLowerCase());
      if (!block) {
        const [newBlock] = await db.insert(blocks).values({
          tenantId,
          complexId,
          name: blockName,
        }).returning();
        block = newBlock;
        blockMap.set(blockName.toLowerCase(), block);
      }

      // ─── Buscar o crear apartamento ──────────────────────────────────────────
      let apartment = await db.query.apartments.findFirst({
        where: and(
          eq(apartments.blockId, block.id),
          eq(apartments.tenantId, tenantId),
          eq(apartments.number, aptNumber),
          isNull(apartments.deletedAt),
        ),
      });

      if (!apartment) {
        const [newApt] = await db.insert(apartments).values({
          tenantId,
          complexId,
          blockId: block.id,
          number: aptNumber,
          ownerName: row.propietario?.toString().trim() || null,
          ownerPhone: row.telefono?.toString().trim() || null,
          ownerEmail: row.email?.toString().trim() || null,
        }).returning();
        apartment = newApt;
      }

      // ─── Validar límite de vehículos por apartamento ─────────────────────────
      const [{ count: vehicleCount }] = await db
        .select({ count: count() })
        .from(vehicles)
        .where(and(
          eq(vehicles.apartmentId, apartment.id),
          eq(vehicles.tenantId, tenantId),
          isNull(vehicles.deletedAt),
        ));

      if (Number(vehicleCount) >= apartment.maxVehicles) {
        result.errors.push({
          row: rowNum,
          placa,
          reason: `El Apto. ${aptNumber} del Bloque ${blockName} ya tiene ${apartment.maxVehicles} vehículos registrados`,
        });
        continue;
      }

      // ─── Verificar si la placa ya existe ─────────────────────────────────────
      const existingVehicle = await db.query.vehicles.findFirst({
        where: and(
          eq(vehicles.tenantId, tenantId),
          eq(vehicles.placa, placa),
          isNull(vehicles.deletedAt),
        ),
      });

      if (existingVehicle) {
        result.errors.push({ row: rowNum, placa, reason: `La placa ${placa} ya está registrada` });
        continue;
      }

      // ─── Crear vehículo ───────────────────────────────────────────────────────
      await db.insert(vehicles).values({
        tenantId,
        complexId,
        apartmentId: apartment.id,
        placa,
        tipo: tipoFinal as any,
        ownerName: row.propietario?.toString().trim() || null,
        ownerPhone: row.telefono?.toString().trim() || null,
        ownerEmail: row.email?.toString().trim() || null,
      });

      result.success++;
    } catch (err: any) {
      result.errors.push({ row: rowNum, placa: row.placa || "-", reason: err.message || "Error desconocido" });
    }
  }

  // ─── Registrar el log de importación ─────────────────────────────────────────
  await db.insert(importLogs).values({
    tenantId,
    complexId,
    fileName,
    totalRows: rows.length,
    successRows: result.success,
    errorRows: result.errors.length,
    errorsDetail: result.errors,
    importedBy: importedBy ?? null,
  });

  return result;
}
