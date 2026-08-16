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

// ─── BLOQUEAR ACCESO ─────────────────────────────────────────────────────────
import { db } from "@/db";
import { apartments } from "@/db/schema/residential";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";

const blockSchema = z.object({
  blockReason: z.string().trim().min(3, "El motivo debe tener al menos 3 caracteres").max(500),
});

async function getAdminSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");
  if (!session) return null;
  try {
    const data = JSON.parse(session.value);
    if (!["admin", "superadmin"].includes(data.role)) return null;
    return data;
  } catch {
    return null;
  }
}

export async function blockApartmentAccessAction(
  tenantId: string,
  apartmentId: string,
  rawData: unknown,
) {
  const parsed = blockSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors.blockReason?.[0] ?? "Motivo inválido" };
  }

  const session = await getAdminSession();
  if (!session) return { success: false, error: "No autorizado." };

  try {
    await db.update(apartments)
      .set({
        accessBlocked: true,
        blockReason: parsed.data.blockReason,
        blockedAt: new Date(),
      })
      .where(and(eq(apartments.id, apartmentId), eq(apartments.tenantId, tenantId)));

    revalidatePath(`/${session.tenantSlug}/apartamentos`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message ?? "Error al bloquear el acceso." };
  }
}

export async function unblockApartmentAccessAction(
  tenantId: string,
  apartmentId: string,
) {
  const session = await getAdminSession();
  if (!session) return { success: false, error: "No autorizado." };

  try {
    await db.update(apartments)
      .set({ accessBlocked: false, blockReason: null, blockedAt: null })
      .where(and(eq(apartments.id, apartmentId), eq(apartments.tenantId, tenantId)));

    revalidatePath(`/${session.tenantSlug}/apartamentos`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message ?? "Error al desbloquear el acceso." };
  }
}
