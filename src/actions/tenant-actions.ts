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
