import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as tenantSchema from "./schema/tenants";
import * as usersSchema from "./schema/users";
import * as residentialSchema from "./schema/residential";
import * as vehiclesSchema from "./schema/vehicles";
import * as parkingSchema from "./schema/parking";
import * as auditSchema from "./schema/audit";

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, {
  schema: {
    ...tenantSchema,
    ...usersSchema,
    ...residentialSchema,
    ...vehiclesSchema,
    ...parkingSchema,
    ...auditSchema,
  },
});

export type DB = typeof db;
