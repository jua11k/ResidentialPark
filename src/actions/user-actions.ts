"use server";

import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";

type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string[]>;
};

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function generateRandomPassword(length: number = 8): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export async function listTenantUsersAction(tenantId: string) {
  try {
    const list = await db.query.users.findMany({
      where: and(
        eq(users.tenantId, tenantId),
        isNull(users.deletedAt)
      ),
      columns: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
      },
      orderBy: (users, { asc }) => [asc(users.name)]
    });
    return { success: true, data: list };
  } catch (e) {
    return { success: false, error: "Error al listar usuarios" };
  }
}

const createUserSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().trim().min(2, "El nombre es muy corto"),
  username: z.string().trim().min(2, "El usuario es muy corto").regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guiones bajos"),
});

export async function createAdminUserAction(rawData: unknown): Promise<ActionResponse<{ tempPassword: string }>> {
  const parsed = createUserSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, validationErrors: parsed.error.flatten().fieldErrors, error: "Datos inválidos" };
  }

  try {
    const existing = await db.query.users.findFirst({
      where: and(
        eq(users.tenantId, parsed.data.tenantId),
        eq(users.username, parsed.data.username),
        isNull(users.deletedAt)
      )
    });

    if (existing) {
      return { success: false, validationErrors: { username: ["Este usuario ya existe en el conjunto"] }, error: "Usuario duplicado" };
    }

    const tempPassword = generateRandomPassword();
    const hashedPassword = hashPassword(tempPassword);

    await db.insert(users).values({
      tenantId: parsed.data.tenantId,
      name: parsed.data.name,
      username: parsed.data.username,
      passwordHash: hashedPassword,
      role: "admin",
    });

    return { success: true, data: { tempPassword } };
  } catch (e) {
    return { success: false, error: "Error al crear usuario" };
  }
}

export async function resetUserPasswordAction(userId: string): Promise<ActionResponse<{ tempPassword: string }>> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) return { success: false, error: "Usuario no encontrado" };

    const tempPassword = generateRandomPassword();
    const hashedPassword = hashPassword(tempPassword);

    await db.update(users)
      .set({ 
        passwordHash: hashedPassword,
        sessionToken: null // Invalida la sesión actual del usuario al cambiar la contraseña
      })
      .where(eq(users.id, userId));

    return { success: true, data: { tempPassword } };
  } catch (e) {
    return { success: false, error: "Error al reiniciar contraseña" };
  }
}

export async function deleteUserAction(userId: string): Promise<ActionResponse<null>> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) return { success: false, error: "Usuario no encontrado" };

    await db.update(users)
      .set({ 
        deletedAt: new Date(),
        status: "inactive",
        sessionToken: null // Invalida la sesión actual
      })
      .where(eq(users.id, userId));

    return { success: true };
  } catch (e) {
    return { success: false, error: "Error al eliminar usuario" };
  }
}
