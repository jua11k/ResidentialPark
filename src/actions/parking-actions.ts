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
    const { db } = await import("@/db");
    const { vehicles } = await import("@/db/schema/vehicles");
    const { apartments, residentialComplexes } = await import("@/db/schema/residential");
    const { parkingRecords } = await import("@/db/schema/parking");
    const { eq, and, inArray } = await import("drizzle-orm");

    // 1. Obtener datos del vehículo + apartamento
    const vehicle = await db.query.vehicles.findFirst({
      where: eq(vehicles.id, parsed.data.vehicleId),
      with: { apartment: { columns: { id: true, accessBlocked: true, blockReason: true } } },
    });

    if (!vehicle) {
      return { success: false, error: "Vehículo no encontrado." };
    }

    // 2. Verificar bloqueo del apartamento
    if (vehicle.apartment?.accessBlocked) {
      return {
        success: false,
        blocked: true,
        error: vehicle.apartment.blockReason
          ? `Acceso bloqueado: ${vehicle.apartment.blockReason}`
          : "El apartamento tiene el acceso restringido. Comuníquese con la administración.",
      } as any;
    }

    // 3. Verificar cupos disponibles por tipo de vehículo
    const complex = await db.query.residentialComplexes.findFirst({
      where: eq(residentialComplexes.id, parsed.data.complexId),
      columns: { carParkingSpots: true, motoParkingSpots: true, bikeParkingSpots: true },
    });

    if (complex) {
      const tipo = vehicle.tipo; // "carro" | "moto" | "camioneta" | "bicicleta"
      const isCar = tipo === "carro" || tipo === "camioneta";
      const isMoto = tipo === "moto";
      const isBike = tipo === "bicicleta";

      const limit = isCar ? complex.carParkingSpots : isMoto ? complex.motoParkingSpots : isBike ? complex.bikeParkingSpots : null;

      if (limit !== null) {
        // Contar cuántos vehículos del mismo tipo están adentro
        const activeVehicleIds = (await db
          .select({ vehicleId: parkingRecords.vehicleId })
          .from(parkingRecords)
          .where(and(eq(parkingRecords.tenantId, tenantId), eq(parkingRecords.status, "inside")))
        ).map((r) => r.vehicleId);

        let occupied = 0;
        if (activeVehicleIds.length > 0) {
          const activeVehicles = await db.query.vehicles.findMany({
            where: inArray(vehicles.id, activeVehicleIds),
            columns: { tipo: true },
          });
          for (const v of activeVehicles) {
            if (isCar && (v.tipo === "carro" || v.tipo === "camioneta")) occupied++;
            else if (isMoto && v.tipo === "moto") occupied++;
            else if (isBike && v.tipo === "bicicleta") occupied++;
          }
        }

        if (occupied >= limit) {
          const typeLabel = isCar ? "carros/camionetas" : isMoto ? "motos" : "bicicletas";
          return { success: false, error: `No hay cupos disponibles para ${typeLabel} (${limit} cupos, todos ocupados).` };
        }
      }
    }

    const record = await registerEntry(
      tenantId,
      parsed.data.complexId,
      parsed.data.vehicleId,
      undefined,
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
