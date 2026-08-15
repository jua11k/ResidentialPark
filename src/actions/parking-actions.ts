"use server";

import {
  getVehicleByPlaca,
  registerEntry,
  registerExit,
  getActiveParking,
  getParkingHistory,
} from "@/services/parking-service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string[]>;
};

// ─── BUSCAR VEHÍCULO POR PLACA ────────────────────────────────────────────────
export async function getVehicleByPlacaAction(
  tenantId: string,
  placa: string,
): Promise<ActionResponse<any>> {
  try {
    const vehicle = await getVehicleByPlaca(tenantId, placa);
    return { success: true, data: vehicle ?? null };
  } catch (e) {
    return { success: false, error: "Error al buscar el vehículo." };
  }
}

// ─── REGISTRAR INGRESO ────────────────────────────────────────────────────────
const entrySchema = z.object({
  vehicleId: z.string().uuid("ID de vehículo inválido"),
  complexId: z.string().uuid("ID de conjunto inválido"),
  observations: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function registerEntryAction(
  tenantId: string,
  rawData: unknown,
): Promise<ActionResponse<any>> {
  const parsed = entrySchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      validationErrors: parsed.error.flatten().fieldErrors,
      error: "Datos de ingreso inválidos.",
    };
  }

  try {
    const record = await registerEntry(
      tenantId,
      parsed.data.complexId,
      parsed.data.vehicleId,
      undefined, // registeredBy — se puede pasar el ID del usuario de sesión
      parsed.data.observations ?? undefined,
    );
    revalidatePath(`/`);
    return { success: true, data: record };
  } catch (e: any) {
    return { success: false, error: e.message ?? "Error al registrar el ingreso." };
  }
}

// ─── REGISTRAR SALIDA ─────────────────────────────────────────────────────────
const exitSchema = z.object({
  placa: z.string().trim().min(1, "La placa es obligatoria"),
});

export async function registerExitAction(
  tenantId: string,
  rawData: unknown,
): Promise<ActionResponse<any>> {
  const parsed = exitSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      validationErrors: parsed.error.flatten().fieldErrors,
      error: "Datos de salida inválidos.",
    };
  }

  try {
    const record = await registerExit(tenantId, parsed.data.placa);
    revalidatePath(`/`);
    return { success: true, data: record };
  } catch (e: any) {
    return { success: false, error: e.message ?? "Error al registrar la salida." };
  }
}

// ─── VEHÍCULOS ACTIVOS ────────────────────────────────────────────────────────
export async function getActiveParkingAction(
  tenantId: string,
  complexId: string,
): Promise<ActionResponse<any>> {
  try {
    const records = await getActiveParking(tenantId, complexId);
    return { success: true, data: records };
  } catch (e) {
    return { success: false, error: "Error al cargar el parqueadero activo." };
  }
}

// ─── HISTORIAL ────────────────────────────────────────────────────────────────
export async function getParkingHistoryAction(
  tenantId: string,
  complexId: string,
  limit?: number,
  offset?: number,
): Promise<ActionResponse<any>> {
  try {
    const records = await getParkingHistory(tenantId, complexId, limit, offset);
    return { success: true, data: records };
  } catch (e) {
    return { success: false, error: "Error al cargar el historial." };
  }
}
