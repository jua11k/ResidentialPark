import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/db";
import { tenants } from "@/db/schema/tenants";
import { eq, and, isNull } from "drizzle-orm";
import TenantConfigClient from "./TenantConfigClient";

export default async function TenantConfigPage({
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

  if (session.role !== "admin" && session.role !== "superadmin") {
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

  const publicPassword = (tenant.config as any)?.publicRegistrationPassword || "";

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl animate-fade-in">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "hsl(210, 40%, 98%)", marginBottom: "0.5rem" }}>
          Configuración del Conjunto
        </h1>
        <p style={{ color: "hsl(215, 25%, 65%)" }}>
          Administra las opciones y reglas globales del sistema para {tenant.name}.
        </p>
      </div>

      <TenantConfigClient
        tenantId={tenant.id}
        initialPublicPassword={publicPassword}
      />
    </div>
  );
}
