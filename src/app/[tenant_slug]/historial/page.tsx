import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { residentialComplexes } from "@/db/schema/residential";
import { parkingRecords } from "@/db/schema/parking";
import { vehicles } from "@/db/schema/vehicles";
import { apartments, blocks } from "@/db/schema/residential";
import { eq, isNull, and, desc } from "drizzle-orm";
import HistorialClient from "@/components/historial/HistorialClient";

export const metadata = {
  title: "Historial | ResidentialPark",
  description: "Historial de ingresos y salidas del parqueadero",
};

export default async function HistorialPage({
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

  // Cargar últimos 100 registros
  const records = await db.query.parkingRecords.findMany({
    where: and(
      eq(parkingRecords.tenantId, session.tenantId),
      eq(parkingRecords.complexId, complex.id),
    ),
    with: {
      vehicle: {
        with: {
          apartment: {
            with: { block: true },
          },
        },
      },
    },
    orderBy: [desc(parkingRecords.entryTime)],
    limit: 100,
  });

  return (
    <HistorialClient
      records={records as any}
      complexName={complex.name}
    />
  );
}
