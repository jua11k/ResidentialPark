"use server";

import { db } from "@/db";
import { tenants } from "@/db/schema/tenants";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function updateTenantConfigAction(
  tenantId: string,
  newConfig: any,
): Promise<ActionResponse<any>> {
  try {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant) {
      return { success: false, error: "Tenant no encontrado." };
    }

    const updatedConfig = {
      ...(tenant.config as Record<string, any>),
      ...newConfig,
    };

    const [updatedTenant] = await db
      .update(tenants)
      .set({ config: updatedConfig })
      .where(eq(tenants.id, tenantId))
      .returning();

    revalidatePath(`/${tenant.slug}/configuracion`);
    return { success: true, data: updatedTenant };
  } catch (error: any) {
    return { success: false, error: error.message ?? "Error al actualizar la configuración." };
  }
}

// ─── ACTUALIZAR CUPOS DE PARQUEADERO DEL CONJUNTO ─────────────────────────────
import { residentialComplexes } from "@/db/schema/residential";

export async function updateComplexParkingSpotsAction(
  tenantId: string,
  complexId: string,
  spots: {
    carParkingSpots: number | null;
    motoParkingSpots: number | null;
    bikeParkingSpots: number | null;
  },
): Promise<ActionResponse<any>> {
  try {
    const [updated] = await db
      .update(residentialComplexes)
      .set({
        carParkingSpots: spots.carParkingSpots,
        motoParkingSpots: spots.motoParkingSpots,
        bikeParkingSpots: spots.bikeParkingSpots,
      })
      .where(eq(residentialComplexes.id, complexId))
      .returning();

    const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
    if (tenant) revalidatePath(`/${tenant.slug}/configuracion`);

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message ?? "Error al actualizar los cupos." };
  }
}

// ─── LOGO DEL CONJUNTO ────────────────────────────────────────────────────────
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function uploadTenantLogoAction(
  tenantId: string,
  formData: FormData
): Promise<ActionResponse<any>> {
  try {
    const file = formData.get("logo") as File | null;
    if (!file) return { success: false, error: "No se proporcionó ningún archivo." };

    if (!file.type.startsWith("image/")) {
      return { success: false, error: "El archivo debe ser una imagen." };
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return { success: false, error: "La imagen no debe superar los 5MB." };
    }

    const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
    if (!tenant) return { success: false, error: "Tenant no encontrado." };

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop() || "png";
    const filename = `${tenantId}_${crypto.randomUUID()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "logos");

    // Asegurar que el directorio exista
    await mkdir(uploadDir, { recursive: true });

    // Eliminar el logo anterior si existía (opcional pero recomendado para no llenar disco local)
    const oldConfig = tenant.config as any;
    if (oldConfig?.logoUrl) {
      try {
        const oldFilename = path.basename(oldConfig.logoUrl);
        const oldPath = path.join(uploadDir, oldFilename);
        await unlink(oldPath);
      } catch (e) {
        console.warn("No se pudo eliminar el logo anterior:", e);
      }
    }

    // Guardar nuevo archivo
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const logoUrl = `/api/uploads/logos/${filename}`;

    const updatedConfig = { ...oldConfig, logoUrl };
    await db.update(tenants).set({ config: updatedConfig }).where(eq(tenants.id, tenantId));

    revalidatePath(`/${tenant.slug}/configuracion`);
    return { success: true, data: { logoUrl } };
  } catch (error: any) {
    console.error("Error uploadTenantLogoAction:", error);
    return { success: false, error: "Error al subir la imagen." };
  }
}

export async function deleteTenantLogoAction(
  tenantId: string
): Promise<ActionResponse<any>> {
  try {
    const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
    if (!tenant) return { success: false, error: "Tenant no encontrado." };

    const oldConfig = tenant.config as any;
    if (oldConfig?.logoUrl) {
      try {
        const oldFilename = path.basename(oldConfig.logoUrl);
        const oldPath = path.join(process.cwd(), "public", "uploads", "logos", oldFilename);
        await unlink(oldPath);
      } catch (e) {
        console.warn("No se pudo eliminar el archivo del disco:", e);
      }
    }

    const updatedConfig = { ...oldConfig };
    delete updatedConfig.logoUrl;

    await db.update(tenants).set({ config: updatedConfig }).where(eq(tenants.id, tenantId));
    revalidatePath(`/${tenant.slug}/configuracion`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleteTenantLogoAction:", error);
    return { success: false, error: "Error al eliminar el logo." };
  }
}
