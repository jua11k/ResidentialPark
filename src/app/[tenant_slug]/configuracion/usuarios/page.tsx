import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/db";
import { tenants } from "@/db/schema/tenants";
import { eq, and, isNull } from "drizzle-orm";
import UserListClient from "@/components/usuarios/UserListClient";
import { listTenantUsersAction } from "@/actions/user-actions";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ tenant_slug: string }>;
}) {
  const { tenant_slug } = await params;
  
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) redirect("/login");

  let session: any;
  try {
    session = JSON.parse(sessionCookie.value);
  } catch {
    redirect("/login");
  }

  if (session.role !== "superadmin") {
    redirect(`/${tenant_slug}/porteria`);
  }

  const tenant = await db.query.tenants.findFirst({
    where: and(
      eq(tenants.slug, tenant_slug),
      isNull(tenants.deletedAt),
      eq(tenants.active, true)
    ),
  });

  if (!tenant) {
    notFound();
  }

  const result = await listTenantUsersAction(tenant.id);
  const initialUsers = result.success && result.data ? result.data : [];

  return (
    <div className="container mx-auto max-w-5xl animate-fade-in">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "hsl(210, 40%, 98%)", marginBottom: "0.5rem" }}>
          Gestión de Usuarios
        </h1>
        <p style={{ color: "hsl(215, 25%, 65%)" }}>
          Crea y administra los usuarios con acceso a la plataforma para el conjunto {tenant.name}.
        </p>
      </div>

      <UserListClient 
        tenantId={tenant.id} 
        tenantSlug={tenant_slug} 
        initialUsers={initialUsers}
        currentUserId={session.userId}
      />
    </div>
  );
}
