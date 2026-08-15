"use server";

import { getSessionAction } from "./auth-actions";
import { createBulkApartments } from "@/services/apartment-service";
import type { BulkConfig } from "@/services/apartment-service";
import { revalidatePath } from "next/cache";

export async function createBulkApartmentsAction(
  tenantId: string,
  complexId: string,
  blockNames: string[],
  config: BulkConfig,
  maxVehicles: number = 2
) {
  try {
    const session = await getSessionAction();
    if (!session || session.tenantId !== tenantId) {
      return { success: false, error: "No autorizado para este tenant" };
    }

    if (!blockNames || blockNames.length === 0) {
      return { success: false, error: "Debe proveer al menos un nombre de bloque" };
    }

    const result = await createBulkApartments(
      tenantId,
      complexId,
      blockNames,
      config,
      maxVehicles
    );

    if (result.success) {
      // Revalidamos la ruta de apartamentos para que se muestren los nuevos datos
      revalidatePath("/[tenant_slug]/apartamentos", "page");
    }

    return result;
  } catch (error: any) {
    console.error("[createBulkApartmentsAction] Error:", error);
    return { success: false, error: "Error de servidor al crear configuración masiva" };
  }
}
