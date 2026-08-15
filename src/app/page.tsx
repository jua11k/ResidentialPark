import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import RegisterTenantForm from "@/components/RegisterTenantForm";
import { Building2, ShieldCheck, Car, Smartphone } from "lucide-react";

export default async function RootPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");

  if (session) {
    try {
      const { tenantSlug } = JSON.parse(session.value);
      if (tenantSlug) {
        redirect(`/${tenantSlug}/porteria`);
      }
    } catch {
      // Cookie inválida
    }
  }

  return (
    <main className="min-h-screen" style={{ background: "hsl(224, 71%, 4%)", overflowX: "hidden" }}>
      {/* Background glow effects */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "50%",
          height: "50%",
          background: "radial-gradient(ellipse, hsl(221, 83%, 20%) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "50%",
          height: "50%",
          background: "radial-gradient(ellipse, hsl(270, 60%, 15%) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div className="container mx-auto px-4 py-12 md:py-24" style={{ position: "relative", zIndex: 1 }}>
        
        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "4rem" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px",
            borderRadius: "1rem", background: "linear-gradient(135deg, hsl(221, 83%, 53%), hsl(221, 83%, 35%))",
            boxShadow: "0 0 20px hsl(221, 83%, 40%, 0.4)"
          }}>
            <Building2 size={24} color="white" />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(210, 40%, 98%)", letterSpacing: "-0.025em" }}>
            ResidentialPark
          </h1>
        </header>

        <div className="flex flex-col lg:flex-row gap-12 items-center justify-between">
          
          {/* Left Column: Hero Text */}
          <div className="flex-1 animate-fade-in" style={{ maxWidth: "600px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "hsl(221, 83%, 15%)", color: "hsl(221, 83%, 65%)", padding: "0.5rem 1rem", borderRadius: "2rem", fontSize: "0.875rem", fontWeight: 600, marginBottom: "1.5rem" }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", background: "hsl(221, 83%, 65%)", borderRadius: "50%", boxShadow: "0 0 8px hsl(221, 83%, 65%)" }}></span>
              Plataforma SaaS para Conjuntos
            </div>
            
            <h2 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 800, color: "white", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "1.5rem" }}>
              Control de acceso <span style={{ color: "transparent", backgroundClip: "text", WebkitBackgroundClip: "text", backgroundImage: "linear-gradient(90deg, hsl(221, 83%, 65%), hsl(270, 80%, 70%))" }}>inteligente</span> y seguro.
            </h2>
            
            <p style={{ fontSize: "1.125rem", color: "hsl(215, 25%, 65%)", lineHeight: 1.6, marginBottom: "2.5rem" }}>
              Gestiona los parqueaderos, vehículos y residentes de tu conjunto residencial desde una plataforma unificada, rápida y fácil de usar.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              {[
                { icon: ShieldCheck, title: "Seguridad total", desc: "Registro y control de portería" },
                { icon: Car, title: "Parqueaderos", desc: "Gestión de celdas y visitantes" },
                { icon: Building2, title: "Multi-torre", desc: "Soporte para múltiples bloques" },
                { icon: Smartphone, title: "En la nube", desc: "Accede desde cualquier lugar" },
              ].map((Feature, i) => (
                <div key={i} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{ padding: "0.75rem", background: "hsl(221, 83%, 10%)", borderRadius: "0.75rem", color: "hsl(221, 83%, 65%)" }}>
                    <Feature.icon size={20} />
                  </div>
                  <div>
                    <h3 style={{ color: "hsl(210, 40%, 98%)", fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.25rem" }}>{Feature.title}</h3>
                    <p style={{ color: "hsl(215, 25%, 55%)", fontSize: "0.85rem", lineHeight: 1.4 }}>{Feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Registration Form */}
          <div className="flex-1 w-full animate-fade-in" style={{ display: "flex", justifyContent: "center", animationDelay: "0.2s" }}>
            <RegisterTenantForm />
          </div>

        </div>
      </div>
    </main>
  );
}
