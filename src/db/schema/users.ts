import { pgSchema, uuid, varchar, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const residentialParkSchema = pgSchema("residential_park");

export const users = residentialParkSchema.table("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }), // Ahora es opcional
  username: varchar("username", { length: 100 }), // Para los guardas
  passwordHash: text("password_hash").notNull(),
  sessionToken: text("session_token"),
  resetToken: varchar("reset_token", { length: 6 }),
  resetTokenExpires: timestamp("reset_token_expires", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  // superadmin: gestiona el SaaS | admin: gestiona un tenant | operator: usa la portería | viewer: solo lectura
  role: varchar("role", { length: 50 }).default("operator").notNull(),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  tenantEmailIdx: uniqueIndex("users_tenant_email_idx").on(table.tenantId, table.email),
  tenantUsernameIdx: uniqueIndex("users_tenant_username_idx").on(table.tenantId, table.username),
  sessionTokenIdx: index("users_session_token_idx").on(table.sessionToken),
}));

export const insertUserSchema = createInsertSchema(users).extend({
  name: z.string().trim().min(2, "El nombre es muy corto").max(255, "El nombre es demasiado largo"),
  email: z.string().trim().email("El formato del correo es inválido").optional().nullable(),
  username: z.string().trim().min(2, "El usuario es muy corto").max(100).optional().nullable(),
  role: z.enum(["superadmin", "admin", "operator", "viewer"], {
    message: "El rol no es válido",
  }),
});

export const selectUserSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
export type NewUser = z.infer<typeof insertUserSchema>;

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}));
