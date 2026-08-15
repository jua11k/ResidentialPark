import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import { tenants } from "./schema/tenants";
import { users } from "./schema/users";
import { residentialComplexes } from "./schema/residential";
import crypto from "crypto";

dotenv.config();

const connectionString = process.env.DATABASE_URL!;

async function seed() {
  console.log("Seeding database...");
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  try {
    // Crear Tenant
    const [tenant] = await db.insert(tenants).values({
      name: "Conjunto Las Palmas",
      slug: "conjunto-las-palmas",
    }).returning();
    console.log(`✅ Tenant creado: ${tenant.name}`);

    // Crear Conjunto
    const [complex] = await db.insert(residentialComplexes).values({
      tenantId: tenant.id,
      name: "Conjunto Las Palmas Principal",
    }).returning();
    console.log(`✅ Conjunto creado: ${complex.name}`);

    // Crear Usuario Admin/Operador
    const passwordHash = crypto.createHash("sha256").update("123456").digest("hex");
    const [user] = await db.insert(users).values({
      tenantId: tenant.id,
      name: "Operador de Prueba",
      email: "operador@conjunto.com",
      passwordHash,
      role: "operator",
    }).returning();
    console.log(`✅ Usuario creado: ${user.email} (Rol: ${user.role})`);

    console.log("Seeding completado con éxito.");
  } catch (err: any) {
    if (err.code === '23505') { // Unique constraint violation
      console.log("⚠️ Los datos ya existen en la base de datos.");
    } else {
      console.error("Error al ejecutar seed:", err);
    }
  } finally {
    process.exit(0);
  }
}

seed();
