import {
  pgSchema, uuid, varchar, text, timestamp, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { residentialComplexes, apartments } from "./residential";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const residentialParkSchema = pgSchema("residential_park");

export const vehicles = residentialParkSchema.table("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  complexId: uuid("complex_id").references(() => residentialComplexes.id, { onDelete: "cascade" }).notNull(),
  apartmentId: uuid("apartment_id").references(() => apartments.id, { onDelete: "cascade" }).notNull(),
  // Placa única por tenant (un mismo vehículo no puede registrarse 2 veces en el mismo conjunto)
  placa: varchar("placa", { length: 20 }).notNull(),
  tipo: varchar("tipo", { length: 50 }).notNull(), // carro, moto, camioneta, bicicleta
  brand: varchar("brand", { length: 100 }),
  color: varchar("color", { length: 50 }),
  model: varchar("model", { length: 100 }),
  ownerName: varchar("owner_name", { length: 255 }),
  ownerPhone: varchar("owner_phone", { length: 50 }),
  ownerEmail: varchar("owner_email", { length: 255 }),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  // Índice principal: búsqueda de placa por tenant (portería)
  tenantPlacaIdx: uniqueIndex("vehicles_tenant_placa_idx").on(table.tenantId, table.placa),
  // Índice directo en placa para acelerar búsquedas ILIKE 'ABC%'
  placaIdx: index("vehicles_placa_idx").on(table.placa),
  // Índice en ownerName para acelerar búsquedas ILIKE 'Juan%'
  ownerNameIdx: index("vehicles_owner_name_idx").on(table.ownerName),
  // Índice para listar vehículos por apartamento (validar max 2)
  apartmentIdx: index("vehicles_apartment_idx").on(table.apartmentId),
}));

// ─── RELATIONS ─────────────────────────────────────────────────────────────────
export const vehiclesRelations = relations(vehicles, ({ one }) => ({
  tenant: one(tenants, { fields: [vehicles.tenantId], references: [tenants.id] }),
  complex: one(residentialComplexes, { fields: [vehicles.complexId], references: [residentialComplexes.id] }),
  apartment: one(apartments, { fields: [vehicles.apartmentId], references: [apartments.id] }),
}));

// ─── ZOD SCHEMAS ──────────────────────────────────────────────────────────────
export const insertVehicleSchema = createInsertSchema(vehicles).extend({
  placa: z.string().trim().min(3, "La placa es muy corta").max(20, "La placa es demasiado larga").toUpperCase(),
  tipo: z.enum(["carro", "moto", "camioneta", "bicicleta"], {
    message: "El tipo de vehículo no es válido",
  }),
  ownerName: z.string().trim().min(2, "El nombre del propietario es muy corto").max(255).optional().or(z.literal("")),
  ownerPhone: z.string().trim().optional().or(z.literal("")),
  ownerEmail: z.string().trim().email("El formato del correo es inválido").optional().or(z.literal("")),
  brand: z.string().trim().max(100).optional().or(z.literal("")),
  color: z.string().trim().max(50).optional().or(z.literal("")),
  model: z.string().trim().max(100).optional().or(z.literal("")),
});

export const selectVehicleSchema = createSelectSchema(vehicles);
export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = z.infer<typeof insertVehicleSchema>;
