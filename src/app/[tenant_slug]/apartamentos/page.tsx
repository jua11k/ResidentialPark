import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { residentialComplexes, blocks, apartments } from "@/db/schema/residential";
import { vehicles } from "@/db/schema/vehicles";
import { parkingRecords } from "@/db/schema/parking";
import { eq, isNull, and, count } from "drizzle-orm";

import ApartamentosClient from "@/components/apartamentos/ApartamentosClient";

export const metadata = {
  title: "Apartamentos | ResidentialPark",
  description: "Vista de apartamentos y bloques del conjunto residencial",
};

export default async function ApartamentosPage({
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

  const blocksList = await db.query.blocks.findMany({
    where: and(
      eq(blocks.tenantId, session.tenantId),
      eq(blocks.complexId, complex.id),
      isNull(blocks.deletedAt),
    ),
    with: {
      apartments: {
        where: isNull(apartments.deletedAt),
        orderBy: [apartments.number],
      },
    },
    orderBy: [blocks.name],
  });

  const totalApartments = blocksList.reduce((sum, b) => sum + b.apartments.length, 0);

  // Contar vehículos adentro por tipo usando SQL GROUP BY
  const counts = await db
    .select({
      tipo: vehicles.tipo,
      count: count(),
    })
    .from(parkingRecords)
    .innerJoin(vehicles, eq(parkingRecords.vehicleId, vehicles.id))
    .where(and(eq(parkingRecords.tenantId, session.tenantId), eq(parkingRecords.status, "inside")))
    .groupBy(vehicles.tipo);

  let carOccupied = 0;
  let motoOccupied = 0;
  let bikeOccupied = 0;

  for (const row of counts) {
    const c = Number(row.count);
    if (row.tipo === "carro" || row.tipo === "camioneta") carOccupied += c;
    else if (row.tipo === "moto") motoOccupied += c;
    else if (row.tipo === "bicicleta") bikeOccupied += c;
  }

  return (
    <ApartamentosClient
      tenantId={session.tenantId}
      complexId={complex.id}
      complexName={complex.name}
      blocksList={blocksList as any}
      totalApartments={totalApartments}
      parkingData={{
        car: { total: complex.carParkingSpots, occupied: carOccupied },
        moto: { total: complex.motoParkingSpots, occupied: motoOccupied },
        bike: { total: complex.bikeParkingSpots, occupied: bikeOccupied },
      }}
    />
  );
}
