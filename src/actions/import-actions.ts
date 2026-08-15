"use server";

import { importVehiclesFromXlsx } from "@/services/import-service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

const importRowSchema = z.object({
  placa: z.string(),
  tipo: z.string().optional().default("carro"),
  propietario: z.string().optional().default(""),
  apartamento: z.string(),
  bloque: z.string(),
  telefono: z.string().optional().default(""),
  email: z.string().optional().default(""),
});

export async function importVehiclesAction(
  tenantId: string,
  complexId: string,
  fileName: string,
  rows: unknown[],
  importedBy?: string,
): Promise<ActionResponse<any>> {
  if (!rows || rows.length === 0) {
    return { success: false, error: "El archivo no contiene filas para importar." };
  }

  if (rows.length > 500) {
    return { success: false, error: "El archivo excede el límite de 500 vehículos por importación." };
  }

  // Validar y limpiar las filas
  const cleanRows = [];
  for (const row of rows) {
    const parsed = importRowSchema.safeParse(row);
    if (parsed.success) {
      cleanRows.push(parsed.data);
    }
  }

  try {
    const result = await importVehiclesFromXlsx(
      tenantId,
      complexId,
      cleanRows,
      fileName,
      importedBy,
    );

    revalidatePath(`/vehiculos`);
    return { success: true, data: result };
  } catch (e: any) {
    return { success: false, error: e.message ?? "Error al importar los vehículos." };
  }
}
