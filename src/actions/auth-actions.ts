"use server";

import { db } from "@/db";
import { users } from "@/db/schema/users";
import { tenants } from "@/db/schema/tenants";
import { residentialComplexes } from "@/db/schema/residential";
import { eq, and, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import crypto from "crypto";
import { z } from "zod";

type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string[]>;
};

const loginSchema = z.object({
  usernameOrEmail: z.string().trim().min(2, "El usuario o correo es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

// Hash simple SHA-256 para contraseñas (en producción usar bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function loginAction(rawData: unknown): Promise<ActionResponse<any>> {
  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      validationErrors: parsed.error.flatten().fieldErrors,
      error: "Datos de inicio de sesión inválidos.",
    };
  }

  try {
    const isEmail = parsed.data.usernameOrEmail.includes("@");

    // 1. Buscar usuario por email (superadmin) o username (admin/guarda)
    const user = await db.query.users.findFirst({
      where: and(
        isEmail ? eq(users.email, parsed.data.usernameOrEmail) : eq(users.username, parsed.data.usernameOrEmail),
        isNull(users.deletedAt),
        eq(users.status, "active"),
      ),
      with: {
        tenant: true
      }
    });

    if (!user || !user.tenant) {
      return { success: false, error: "Credenciales incorrectas." };
    }

    const tenant = user.tenant;

    if (!tenant.active || tenant.deletedAt !== null) {
      return { success: false, error: "El conjunto residencial no está activo." };
    }

    // 2. Verificar contraseña
    const hashedInput = hashPassword(parsed.data.password);
    if (user.passwordHash !== hashedInput) {
      return { success: false, error: "Credenciales incorrectas." };
    }

    // 3. Generar token de sesión único e invalidar otras sesiones del mismo usuario
    const sessionToken = crypto.randomUUID();
    
    await db.update(users)
      .set({ 
        sessionToken,
        lastLoginAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // 4. Establecer sesión en cookie httpOnly
    const sessionData = JSON.stringify({
      userId: user.id,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      role: user.role,
      name: user.name,
      sessionToken,
    });

    const cookieStore = await cookies();
    cookieStore.set("session", sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    });

    return { success: true, data: { tenantSlug: tenant.slug, role: user.role } };
  } catch (e: any) {
    return { success: false, error: "Error al iniciar sesión. Intente nuevamente." };
  }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  
  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie.value);
      if (session.userId) {
        // Invalida el token en BD
        await db.update(users)
          .set({ sessionToken: null })
          .where(eq(users.id, session.userId));
      }
    } catch {
      // Ignorar
    }
  }
  
  cookieStore.delete("session");
}

export async function getSessionAction() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie) return null;
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

const registerTenantSchema = z.object({
  tenantName: z.string().trim().min(2, "El nombre del conjunto es muy corto").max(255),
  tenantSlug: z.string().trim().min(2, "El slug es muy corto").max(100).regex(/^[a-z0-9-]+$/, "El slug solo puede contener letras minúsculas, números y guiones"),
  adminName: z.string().trim().min(2, "El nombre del administrador es muy corto").max(255),
  email: z.string().trim().email("El formato del correo es inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export async function registerTenantAction(rawData: unknown): Promise<ActionResponse<any>> {
  const parsed = registerTenantSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      validationErrors: parsed.error.flatten().fieldErrors,
      error: "Datos de registro inválidos.",
    };
  }

  try {
    // Verificar si el slug ya existe
    const existingTenant = await db.query.tenants.findFirst({
      where: eq(tenants.slug, parsed.data.tenantSlug),
    });

    if (existingTenant) {
      return { success: false, validationErrors: { tenantSlug: ["El slug ya está en uso."] }, error: "El slug ya está en uso." };
    }

    // Verificar si el correo ya existe
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, parsed.data.email),
    });
    
    if (existingUser) {
        return { success: false, validationErrors: { email: ["El correo ya está registrado."] }, error: "El correo ya está registrado." };
    }

    const tenantResult = await db.insert(tenants).values({
      name: parsed.data.tenantName,
      slug: parsed.data.tenantSlug,
    }).returning();

    const newTenant = tenantResult[0];

    await db.insert(residentialComplexes).values({
      tenantId: newTenant.id,
      name: parsed.data.tenantName,
    });

    const hashedPassword = hashPassword(parsed.data.password);

    await db.insert(users).values({
      tenantId: newTenant.id,
      name: parsed.data.adminName,
      email: parsed.data.email,
      passwordHash: hashedPassword,
      role: "superadmin", // El creador del conjunto es superadmin
    });

    return { success: true, data: { tenantSlug: newTenant.slug } };
  } catch (e: any) {
    return { success: false, error: "Error al registrar el conjunto." };
  }
}
