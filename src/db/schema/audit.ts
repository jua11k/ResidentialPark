import {
  pgSchema, uuid, varchar, text, integer, timestamp, jsonb, index,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { residentialComplexes } from "./residential";
import { users } from "./users";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const residentialParkSchema = pgSchema("residential_park");

// ─── IMPORT LOGS ──────────────────────────────────────────────────────────────
// Registro de cada importación masiva de vehículos desde XLSX
export const importLogs = residentialParkSchema.table("import_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  complexId: uuid("complex_id").references(() => residentialComplexes.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  totalRows: integer("total_rows").default(0).notNull(),
  successRows: integer("success_rows").default(0).notNull(),
  errorRows: integer("error_rows").default(0).notNull(),
  errorsDetail: jsonb("errors_detail").default([]),
  importedBy: uuid("imported_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("import_logs_tenant_idx").on(table.tenantId),
}));

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
// Registro de auditoría para todas las acciones críticas (Regla 04 IAM)
export const auditLogs = residentialParkSchema.table("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id),
  // vehicle | apartment | parking_record | user | complex | block
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id"),
  // create | update | delete | entry | exit | import
  action: varchar("action", { length: 50 }).notNull(),
  beforeState: jsonb("before_state"),
  afterState: jsonb("after_state"),
  ipAddress: varchar("ip_address", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("audit_logs_tenant_idx").on(table.tenantId),
  tenantEntityIdx: index("audit_logs_tenant_entity_idx").on(table.tenantId, table.entityType, table.entityId),
}));

// ─── RELATIONS ─────────────────────────────────────────────────────────────────
export const importLogsRelations = relations(importLogs, ({ one }) => ({
  tenant: one(tenants, { fields: [importLogs.tenantId], references: [tenants.id] }),
  complex: one(residentialComplexes, { fields: [importLogs.complexId], references: [residentialComplexes.id] }),
  importedByUser: one(users, { fields: [importLogs.importedBy], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, { fields: [auditLogs.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

// ─── ZOD SCHEMAS ──────────────────────────────────────────────────────────────
export const insertImportLogSchema = createInsertSchema(importLogs).extend({
  fileName: z.string().trim().min(1, "El nombre del archivo es obligatorio").max(255),
});

export type ImportLog = typeof importLogs.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
