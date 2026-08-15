"use server";

import {
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getAllVehicles,
  getVehiclesByApartment,
} from "@/services/vehicle-service";
import { insertVehicleSchema } from "@/db/schema/vehicles";
import { revalidatePath } from "next/cache";
import { checkApartmentVehicleLimit } from "@/services/public-service";
import { z } from "zod";

type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string[]>;
};

// ─── CREAR VEHÍCULO ───────────────────────────────────────────────────────────
export async function createVehicleAction(
  tenantId: string,
  rawData: unknown,
): Promise<ActionResponse<any>> {
  const parsed = insertVehicleSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      validationErrors: parsed.error.flatten().fieldErrors,
      error: "Datos del vehículo inválidos.",
    };
  }

  try {
    const vehicle = await createVehicle(tenantId, { ...parsed.data, tenantId });
    revalidatePath(`/vehiculos`);
    return { success: true, data: vehicle };
  } catch (e: any) {
    return { success: false, error: e.message ?? "Error al crear el vehículo." };
  }
}

// ─── ACTUALIZAR VEHÍCULO ──────────────────────────────────────────────────────
const updateVehicleSchema = z.object({
  tipo: z.enum(["carro", "moto", "camioneta", "bicicleta"]).optional(),
  brand: z.string().trim().max(100).optional().or(z.literal("")),
  color: z.string().trim().max(50).optional().or(z.literal("")),
  model: z.string().trim().max(100).optional().or(z.literal("")),
  ownerName: z.string().trim().min(2, "El nombre es muy corto").max(255).optional().or(z.literal("")),
  ownerPhone: z.string().trim().optional().or(z.literal("")),
  ownerEmail: z.string().trim().email("Correo inválido").optional().or(z.literal("")),
});

export async function updateVehicleAction(
  tenantId: string,
  vehicleId: string,
  rawData: unknown,
): Promise<ActionResponse<any>> {
  const parsed = updateVehicleSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      validationErrors: parsed.error.flatten().fieldErrors,
      error: "Datos inválidos.",
    };
  }

  try {
    const vehicle = await updateVehicle(tenantId, vehicleId, parsed.data as any);
    revalidatePath(`/vehiculos`);
    return { success: true, data: vehicle };
  } catch (e: any) {
    return { success: false, error: e.message ?? "Error al actualizar el vehículo." };
  }
}

// ─── ELIMINAR VEHÍCULO ────────────────────────────────────────────────────────
export async function deleteVehicleAction(
  tenantId: string,
  vehicleId: string,
  reason?: string,
): Promise<ActionResponse<any>> {
  try {
    const vehicle = await deleteVehicle(tenantId, vehicleId, reason);
    revalidatePath(`/vehiculos`);
    return { success: true, data: vehicle };
  } catch (e: any) {
    return { success: false, error: e.message ?? "Error al eliminar el vehículo." };
  }
}

// ─── LISTAR VEHÍCULOS ─────────────────────────────────────────────────────────
export async function getAllVehiclesAction(
  tenantId: string,
  complexId: string,
): Promise<ActionResponse<any>> {
  try {
    const list = await getAllVehicles(tenantId, complexId);
    return { success: true, data: list };
  } catch (e) {
    return { success: false, error: "Error al cargar los vehículos." };
  }
}

export async function getVehiclesByApartmentAction(
  tenantId: string,
  apartmentId: string,
): Promise<ActionResponse<any>> {
  try {
    const list = await getVehiclesByApartment(tenantId, apartmentId);
    return { success: true, data: list };
  } catch (e) {
    return { success: false, error: "Error al cargar los vehículos del apartamento." };
  }
}

// ─── REGISTRO PÚBLICO (PROPIETARIOS) ──────────────────────────────────────────
export async function registerPublicVehicleAction(
  tenantId: string,
  rawData: unknown,
): Promise<ActionResponse<any>> {
  const parsed = insertVehicleSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      validationErrors: parsed.error.flatten().fieldErrors,
      error: "Datos del vehículo inválidos.",
    };
  }

  try {
    // 1. Verificar límite de vehículos
    const limitCheck = await checkApartmentVehicleLimit(tenantId, parsed.data.apartmentId);
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.error };
    }

    // 2. Crear vehículo
    const vehicle = await createVehicle(tenantId, { ...parsed.data, tenantId });
    return { success: true, data: vehicle };
  } catch (e: any) {
    return { success: false, error: e.message ?? "Error al registrar el vehículo." };
  }
}
