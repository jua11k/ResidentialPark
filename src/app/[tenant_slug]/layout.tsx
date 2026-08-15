import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { tenants } from "@/db/schema/tenants";
import { eq, isNull, and } from "drizzle-orm";
import TenantNav from "@/components/shared/TenantNav";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant_slug: string }>;
}) {
  const { tenant_slug } = await params;

  // 1. Verificar sesión
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) {
    redirect("/login");
  }

  let session: any;
  try {
    session = JSON.parse(sessionCookie.value);
  } catch {
    redirect("/login");
  }

  // 2. Verificar que el slug de la URL corresponde al tenant de la sesión
  if (session.tenantSlug !== tenant_slug) {
    redirect(`/${session.tenantSlug}/porteria`);
  }

  // 3. Resolver el tenant por slug (Regla 05: Resolución de identidad)
  const tenant = await db.query.tenants.findFirst({
    where: and(
      eq(tenants.slug, tenant_slug),
      isNull(tenants.deletedAt),
      eq(tenants.active, true),
    ),
  });

  if (!tenant) {
    notFound();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <TenantNav
        tenantName={tenant.name}
        tenantSlug={tenant_slug}
        userRole={session.role}
        userName={session.name}
      />
      <main style={{ flex: 1, padding: "1.5rem 1rem", maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
        {children}
      </main>
    </div>
  );
}
