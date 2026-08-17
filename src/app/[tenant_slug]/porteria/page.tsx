import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { tenants } from "@/db/schema/tenants";
import { residentialComplexes } from "@/db/schema/residential";
import { eq, isNull, and } from "drizzle-orm";
import PorteriaClient from "@/components/porteria/PorteriaClient";

export const metadata = {
  title: "Portería | ResidentialPark",
  description: "Control de ingreso y salida de vehículos del conjunto residencial",
};

export default async function PorteriaPage({
  params,
}: {
  params: Promise<{ tenant_slug: string }>;
}) {
  const { tenant_slug } = await params;
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  const session = sessionCookie ? JSON.parse(sessionCookie.value) : null;

  if (!session) redirect("/login");

  // Obtener el conjunto del tenant
  const complex = await db.query.residentialComplexes.findFirst({
    where: and(
      eq(residentialComplexes.tenantId, session.tenantId),
      eq(residentialComplexes.status, "active"),
      isNull(residentialComplexes.deletedAt),
    ),
  });

  if (!complex) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <p style={{ color: "hsl(215, 25%, 55%)", marginBottom: "1rem" }}>
          No hay un conjunto residencial configurado para este tenant.
        </p>
        <p style={{ color: "hsl(215, 25%, 40%)", fontSize: "0.875rem" }}>
          Contacte al administrador del sistema.
        </p>
      </div>
    );
  }

  // Pre-cargar la lista de apartamentos
  const { blocks, apartments } = await import("@/db/schema/residential");
  const blocksData = await db.query.blocks.findMany({
    where: and(
      eq(blocks.tenantId, session.tenantId),
      eq(blocks.complexId, complex.id),
      isNull(blocks.deletedAt)
    ),
    with: {
      apartments: {
        where: isNull(apartments.deletedAt),
        columns: { id: true, number: true },
        orderBy: (apartments, { asc }) => [asc(apartments.number)],
      }
    },
    orderBy: (blocks, { asc }) => [asc(blocks.name)],
  });

  // Mapear a una lista plana para el select de Autocompletado
  const initialApartments = blocksData.flatMap(b =>
    b.apartments.map(a => ({
      id: a.id,
      label: `${b.name} · Apto ${a.number}`,
      blockName: b.name,
      number: a.number,
    }))
  );

  return (
    <PorteriaClient
      tenantId={session.tenantId}
      complexId={complex.id}
      complexName={complex.name}
      tenantSlug={tenant_slug}
      initialApartments={initialApartments}
    />
  );
}
