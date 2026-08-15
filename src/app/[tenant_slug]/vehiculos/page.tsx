import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { residentialComplexes } from "@/db/schema/residential";
import { eq, isNull, and } from "drizzle-orm";
import VehiclesClient from "@/components/vehiculos/VehiclesClient";

export const metadata = {
  title: "Vehículos | ResidentialPark",
  description: "Gestión de vehículos registrados en el conjunto residencial",
};

export default async function VehiculosPage({
  params,
}: {
  params: Promise<{ tenant_slug: string }>;
}) {
  const { tenant_slug } = await params;
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  const session = sessionCookie ? JSON.parse(sessionCookie.value) : null;
  if (!session) redirect("/login");

  const complex = await db.query.residentialComplexes.findFirst({
    where: and(
      eq(residentialComplexes.tenantId, session.tenantId),
      eq(residentialComplexes.status, "active"),
      isNull(residentialComplexes.deletedAt),
    ),
  });

  if (!complex) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem", color: "hsl(215, 25%, 55%)" }}>
        No hay un conjunto residencial configurado.
      </div>
    );
  }

  // Cargar vehículos con datos de apartamento y bloque
  const vehiclesList = await db.query.vehicles.findMany({
    where: and(
      eq((await import("@/db/schema/vehicles")).vehicles.tenantId, session.tenantId),
      eq((await import("@/db/schema/vehicles")).vehicles.complexId, complex.id),
      isNull((await import("@/db/schema/vehicles")).vehicles.deletedAt),
    ),
    with: {
      apartment: {
        with: { block: true },
      },
    },
    orderBy: [(await import("@/db/schema/vehicles")).vehicles.createdAt],
  });

  const blocksList = await db.query.blocks.findMany({
    where: and(
      eq((await import("@/db/schema/residential")).blocks.tenantId, session.tenantId),
      eq((await import("@/db/schema/residential")).blocks.complexId, complex.id),
      isNull((await import("@/db/schema/residential")).blocks.deletedAt),
    ),
    with: {
      apartments: {
        where: isNull((await import("@/db/schema/residential")).apartments.deletedAt),
      },
    },
  });

  return (
    <VehiclesClient
      tenantId={session.tenantId}
      complexId={complex.id}
      complexName={complex.name}
      initialVehicles={vehiclesList as any}
      blocks={blocksList as any}
    />
  );
}
