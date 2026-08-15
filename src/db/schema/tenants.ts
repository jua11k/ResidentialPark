import { pgSchema, uuid, varchar, jsonb, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const residentialParkSchema = pgSchema("residential_park");

export const tenants = residentialParkSchema.table("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  config: jsonb("config").default({}).notNull(),
  active: boolean("active").default(true),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const insertTenantSchema = createInsertSchema(tenants).extend({
  name: z.string().trim().min(2, "El nombre del tenant es muy corto").max(255, "El nombre es demasiado largo"),
  slug: z.string().trim().min(2, "El slug es muy corto").max(100, "El slug es muy largo").regex(/^[a-z0-9-]+$/, "El slug solo puede contener letras minúsculas, números y guiones"),
});

export const selectTenantSchema = createSelectSchema(tenants);
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = z.infer<typeof insertTenantSchema>;
