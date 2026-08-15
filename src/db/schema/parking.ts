import {
  pgSchema, uuid, varchar, text, timestamp, index,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { residentialComplexes, apartments } from "./residential";
import { vehicles } from "./vehicles";
import { users } from "./users";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const residentialParkSchema = pgSchema("residential_park");

// ─── PARKING RECORDS ──────────────────────────────────────────────────────────
// Registro de cada movimiento de ingreso/salida de vehículos al parqueadero
export const parkingRecords = residentialParkSchema.table("parking_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  complexId: uuid("complex_id").references(() => residentialComplexes.id, { onDelete: "cascade" }).notNull(),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id).notNull(),
  apartmentId: uuid("apartment_id").references(() => apartments.id).notNull(),
  registeredBy: uuid("registered_by").references(() => users.id), // Operador que registró el movimiento
  entryTime: timestamp("entry_time", { withTimezone: true }).defaultNow().notNull(),
  exitTime: timestamp("exit_time", { withTimezone: true }),
  // inside: vehículo actualmente dentro | completed: salió | cancelled: anulado
  status: varchar("status", { length: 20 }).default("inside").notNull(),
  observations: text("observations"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  // Índice principal para consultar vehículos activos (portería)
  tenantStatusIdx: index("records_tenant_status_idx").on(table.tenantId, table.status),
  // Índice para historial por fecha
  tenantEntryIdx: index("records_tenant_entry_idx").on(table.tenantId, table.entryTime),
  // Índice para verificar si un vehículo específico está adentro
  vehicleStatusIdx: index("records_vehicle_status_idx").on(table.vehicleId, table.status),
  // Índice para verificar si un apartamento tiene ocupado su parqueo
  apartmentStatusIdx: index("records_apartment_status_idx").on(table.apartmentId, table.status),
}));

// ─── RELATIONS ─────────────────────────────────────────────────────────────────
export const parkingRecordsRelations = relations(parkingRecords, ({ one }) => ({
  tenant: one(tenants, { fields: [parkingRecords.tenantId], references: [tenants.id] }),
  complex: one(residentialComplexes, { fields: [parkingRecords.complexId], references: [residentialComplexes.id] }),
  vehicle: one(vehicles, { fields: [parkingRecords.vehicleId], references: [vehicles.id] }),
  apartment: one(apartments, { fields: [parkingRecords.apartmentId], references: [apartments.id] }),
  registeredByUser: one(users, { fields: [parkingRecords.registeredBy], references: [users.id] }),
}));

// ─── ZOD SCHEMAS ──────────────────────────────────────────────────────────────
export const insertParkingRecordSchema = createInsertSchema(parkingRecords).extend({
  status: z.enum(["inside", "completed", "cancelled"], {
    errorMap: () => ({ message: "El estado del registro no es válido" }),
  }),
  observations: z.string().trim().max(500, "Las observaciones son demasiado largas").optional().or(z.literal("")),
});

export const selectParkingRecordSchema = createSelectSchema(parkingRecords);
export type ParkingRecord = typeof parkingRecords.$inferSelect;
export type NewParkingRecord = z.infer<typeof insertParkingRecordSchema>;
