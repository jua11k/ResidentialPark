import {
  pgSchema, uuid, varchar, text, timestamp, integer, boolean, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const residentialParkSchema = pgSchema("residential_park");

// ─── 1. RESIDENTIAL COMPLEXES ─────────────────────────────────────────────────
// Representa el conjunto residencial. Un tenant puede operar múltiples conjuntos.
export const residentialComplexes = residentialParkSchema.table("residential_complexes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 500 }),
  city: varchar("city", { length: 100 }),
  nit: varchar("nit", { length: 50 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  totalParkingSpots: integer("total_parking_spots").default(0),
  // Cupos independientes por tipo de vehículo (null = sin límite / igual al nro de aptos)
  carParkingSpots: integer("car_parking_spots"),
  motoParkingSpots: integer("moto_parking_spots"),
  bikeParkingSpots: integer("bike_parking_spots"),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  tenantIdx: index("complexes_tenant_idx").on(table.tenantId),
}));

// ─── 2. BLOCKS ────────────────────────────────────────────────────────────────
// Torres o bloques dentro de un conjunto residencial
export const blocks = residentialParkSchema.table("blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  complexId: uuid("complex_id").references(() => residentialComplexes.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(), // "Torre A", "Bloque 1", "Edificio Norte"
  totalFloors: integer("total_floors"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  tenantComplexIdx: index("blocks_tenant_complex_idx").on(table.tenantId, table.complexId),
}));

// ─── 3. APARTMENTS ────────────────────────────────────────────────────────────
// Cada apartamento tiene un espacio de parqueo propio (max 1 vehículo adentro)
// y puede registrar hasta maxVehicles vehículos (default: 2)
export const apartments = residentialParkSchema.table("apartments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  complexId: uuid("complex_id").references(() => residentialComplexes.id, { onDelete: "cascade" }).notNull(),
  blockId: uuid("block_id").references(() => blocks.id, { onDelete: "cascade" }).notNull(),
  number: varchar("number", { length: 50 }).notNull(), // "101", "202", "Penthouse 1"
  floor: integer("floor"),
  ownerName: varchar("owner_name", { length: 255 }),
  ownerPhone: varchar("owner_phone", { length: 50 }),
  ownerEmail: varchar("owner_email", { length: 255 }),
  // Flag O(1) para saber si el parqueadero de este apto está ocupado actualmente
  parkingOccupied: boolean("parking_occupied").default(false).notNull(),
  // Máximo de vehículos que puede registrar este apartamento (configurable)
  maxVehicles: integer("max_vehicles").default(2).notNull(),
  // Bloqueo de acceso por mora u otras razones administrativas
  accessBlocked: boolean("access_blocked").default(false).notNull(),
  blockReason: varchar("block_reason", { length: 500 }),
  blockedAt: timestamp("blocked_at", { withTimezone: true }),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  tenantComplexIdx: index("apartments_tenant_complex_idx").on(table.tenantId, table.complexId),
  tenantBlockIdx: index("apartments_tenant_block_idx").on(table.tenantId, table.blockId),
  // Índice compuesto para búsqueda rápida bloque+número
  blockNumberIdx: uniqueIndex("apartments_block_number_idx").on(table.blockId, table.number),
}));

// ─── RELATIONS ─────────────────────────────────────────────────────────────────
export const residentialComplexesRelations = relations(residentialComplexes, ({ one, many }) => ({
  tenant: one(tenants, { fields: [residentialComplexes.tenantId], references: [tenants.id] }),
  blocks: many(blocks),
  apartments: many(apartments),
}));

export const blocksRelations = relations(blocks, ({ one, many }) => ({
  tenant: one(tenants, { fields: [blocks.tenantId], references: [tenants.id] }),
  complex: one(residentialComplexes, { fields: [blocks.complexId], references: [residentialComplexes.id] }),
  apartments: many(apartments),
}));

export const apartmentsRelations = relations(apartments, ({ one }) => ({
  tenant: one(tenants, { fields: [apartments.tenantId], references: [tenants.id] }),
  complex: one(residentialComplexes, { fields: [apartments.complexId], references: [residentialComplexes.id] }),
  block: one(blocks, { fields: [apartments.blockId], references: [blocks.id] }),
}));

// ─── ZOD SCHEMAS ──────────────────────────────────────────────────────────────
export const insertComplexSchema = createInsertSchema(residentialComplexes).extend({
  name: z.string().trim().min(2, "El nombre del conjunto es muy corto").max(255),
  email: z.string().trim().email("El formato del correo es inválido").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
});

export const insertBlockSchema = createInsertSchema(blocks).extend({
  name: z.string().trim().min(1, "El nombre del bloque es obligatorio").max(100),
});

export const insertApartmentSchema = createInsertSchema(apartments).extend({
  number: z.string().trim().min(1, "El número del apartamento es obligatorio").max(50),
  ownerName: z.string().trim().min(2, "El nombre del propietario es muy corto").max(255).optional().or(z.literal("")),
  ownerPhone: z.string().trim().optional().or(z.literal("")),
  ownerEmail: z.string().trim().email("El formato del correo es inválido").optional().or(z.literal("")),
});

export const selectComplexSchema = createSelectSchema(residentialComplexes);
export const selectBlockSchema = createSelectSchema(blocks);
export const selectApartmentSchema = createSelectSchema(apartments);

export type ResidentialComplex = typeof residentialComplexes.$inferSelect;
export type NewResidentialComplex = z.infer<typeof insertComplexSchema>;
export type Block = typeof blocks.$inferSelect;
export type NewBlock = z.infer<typeof insertBlockSchema>;
export type Apartment = typeof apartments.$inferSelect;
export type NewApartment = z.infer<typeof insertApartmentSchema>;
