import { notFound } from "next/navigation";
import { getPublicComplexData } from "@/services/public-service";
import PublicVehicleForm from "@/components/vehiculos/PublicVehicleForm";
import { Building2, ShieldCheck, CheckCircle2, Car, Bike } from "lucide-react";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ tenant_slug: string }> }): Promise<Metadata> {
  const { tenant_slug } = await params;
  const data = await getPublicComplexData(tenant_slug);
  
  if (!data) {
    return { title: "Conjunto no encontrado" };
  }

  return {
    title: `Registro de Vehículos - ${data.tenantName}`,
    description: `Formulario de registro de vehículos para residentes de ${data.tenantName}`,
  };
}

export default async function PublicRegistrationPage({
  params,
}: {
  params: Promise<{ tenant_slug: string }>;
}) {
  const { tenant_slug } = await params;
  const data = await getPublicComplexData(tenant_slug);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen" style={{ background: "hsl(224, 71%, 4%)", padding: "2rem 1rem", position: "relative", overflowX: "hidden" }}>
      {/* Background glow effects */}
      <div
        style={{
          position: "fixed",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "80%",
          height: "60%",
          background: "radial-gradient(ellipse at top, hsl(221, 83%, 15%) 0%, transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <header style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "3rem" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", width: "64px", height: "64px",
            borderRadius: "1.25rem", background: "linear-gradient(135deg, hsl(221, 83%, 53%), hsl(221, 83%, 35%))",
            boxShadow: "0 0 30px hsl(221, 83%, 40%, 0.4)", marginBottom: "1.5rem"
          }}>
            <Building2 size={32} color="white" />
          </div>
          
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "hsl(221, 83%, 15%)", color: "hsl(221, 83%, 65%)", padding: "0.35rem 1rem", borderRadius: "2rem", fontSize: "0.85rem", fontWeight: 600, marginBottom: "1rem" }}>
            <CheckCircle2 size={14} /> Registro Oficial
          </div>

          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "hsl(210, 40%, 98%)", letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
            {data.tenantName}
          </h1>
          <p style={{ color: "hsl(215, 25%, 65%)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
            Formulario de registro de vehículos para residentes y propietarios.
          </p>
        </header>

        {/* Panel de disponibilidad de parqueaderos */}
        {(data.parking.car.total !== null || data.parking.moto.total !== null || data.parking.bike.total !== null) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center", marginBottom: "2rem" }}>
            {data.parking.car.total !== null && (
              <div style={{
                display: "flex", alignItems: "center", gap: "0.625rem",
                background: (data.parking.car.available ?? 0) > 0 ? "hsl(142, 71%, 8%)" : "hsl(0, 60%, 8%)",
                border: `1px solid ${(data.parking.car.available ?? 0) > 0 ? "hsl(142, 71%, 20%)" : "hsl(0, 72%, 25%)"}`,
                borderRadius: "0.75rem", padding: "0.625rem 1rem"
              }}>
                <Car size={18} style={{ color: (data.parking.car.available ?? 0) > 0 ? "hsl(142, 71%, 45%)" : "hsl(0, 72%, 55%)" }} />
                <div>
                  <p style={{ fontSize: "0.7rem", color: "hsl(215, 25%, 55%)", fontWeight: 500 }}>Carros / Camionetas</p>
                  <p style={{ fontSize: "0.9rem", fontWeight: 700, color: (data.parking.car.available ?? 0) > 0 ? "hsl(142, 71%, 55%)" : "hsl(0, 72%, 65%)" }}>
                    {(data.parking.car.available ?? 0) > 0 ? `${data.parking.car.available} disponibles` : "Sin cupos"}
                    <span style={{ fontWeight: 400, color: "hsl(215, 25%, 50%)", marginLeft: "0.25rem", fontSize: "0.75rem" }}>de {data.parking.car.total}</span>
                  </p>
                </div>
              </div>
            )}
            {data.parking.moto.total !== null && (
              <div style={{
                display: "flex", alignItems: "center", gap: "0.625rem",
                background: (data.parking.moto.available ?? 0) > 0 ? "hsl(142, 71%, 8%)" : "hsl(0, 60%, 8%)",
                border: `1px solid ${(data.parking.moto.available ?? 0) > 0 ? "hsl(142, 71%, 20%)" : "hsl(0, 72%, 25%)"}`,
                borderRadius: "0.75rem", padding: "0.625rem 1rem"
              }}>
                <Bike size={18} style={{ color: (data.parking.moto.available ?? 0) > 0 ? "hsl(142, 71%, 45%)" : "hsl(0, 72%, 55%)" }} />
                <div>
                  <p style={{ fontSize: "0.7rem", color: "hsl(215, 25%, 55%)", fontWeight: 500 }}>Motos</p>
                  <p style={{ fontSize: "0.9rem", fontWeight: 700, color: (data.parking.moto.available ?? 0) > 0 ? "hsl(142, 71%, 55%)" : "hsl(0, 72%, 65%)" }}>
                    {(data.parking.moto.available ?? 0) > 0 ? `${data.parking.moto.available} disponibles` : "Sin cupos"}
                    <span style={{ fontWeight: 400, color: "hsl(215, 25%, 50%)", marginLeft: "0.25rem", fontSize: "0.75rem" }}>de {data.parking.moto.total}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: "center" }}>
          
          {/* Instrucciones (Opcional, lado izquierdo en desktop) */}
          <div className="hidden lg:block animate-fade-in" style={{ flex: "1", maxWidth: "380px", paddingTop: "2rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "white", marginBottom: "1.5rem" }}>
              Instrucciones importantes
            </h3>
            <ul style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {[
                { title: "Verifique su apartamento", desc: "Asegúrese de seleccionar correctamente su torre y apartamento para evitar problemas de acceso." },
                { title: "Límite de vehículos", desc: "Cada apartamento tiene un límite de vehículos configurado por la administración. Si recibe un error, contacte a la administración." },
                { title: "Datos precisos", desc: "La placa y tipo de vehículo son obligatorios. Asegúrese de ingresarlos sin errores." },
              ].map((item, i) => (
                <li key={i} style={{ display: "flex", gap: "1rem" }}>
                  <div style={{ padding: "0.5rem", background: "hsl(221, 83%, 10%)", borderRadius: "0.5rem", color: "hsl(221, 83%, 65%)", height: "fit-content" }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 style={{ color: "hsl(210, 40%, 98%)", fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.25rem" }}>{item.title}</h4>
                    <p style={{ color: "hsl(215, 25%, 60%)", fontSize: "0.85rem", lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Formulario */}
          <div style={{ flex: "1", maxWidth: "540px", minWidth: "300px" }}>
            <PublicVehicleForm 
              tenantId={data.tenantId} 
              blocks={data.blocks}
              hasPassword={data.hasPassword}
              parking={data.parking}
            />
          </div>

        </div>

        <footer style={{ textAlign: "center", color: "hsl(215, 25%, 40%)", fontSize: "0.85rem", marginTop: "4rem" }}>
          © {new Date().getFullYear()} {data.tenantName} · Plataforma provista por ResidentialPark
        </footer>

      </div>
    </main>
  );
}
