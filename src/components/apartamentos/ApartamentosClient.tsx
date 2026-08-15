"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import BulkConfigModal from "./BulkConfigModal";
import { toast } from "sonner";

interface ApartamentosClientProps {
  tenantId: string;
  complexId: string;
  complexName: string;
  blocksList: any[];
  totalApartments: number;
  occupiedSpots: number;
}

export default function ApartamentosClient({
  tenantId,
  complexId,
  complexName,
  blocksList,
  totalApartments,
  occupiedSpots,
}: ApartamentosClientProps) {
  const [showBulkConfig, setShowBulkConfig] = useState(false);

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(210, 40%, 98%)", letterSpacing: "-0.02em" }}>
            🏠 Apartamentos
          </h1>
          <p style={{ color: "hsl(215, 25%, 55%)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {complexName} · {blocksList.length} bloque{blocksList.length !== 1 ? "s" : ""} · {totalApartments} apartamentos
          </p>
        </div>
        <button onClick={() => setShowBulkConfig(true)} className="btn-secondary">
          <Settings size={16} />
          Configuración Masiva
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
        {[
          { label: "Bloques", value: blocksList.length, icon: "🏗️" },
          { label: "Total Aptos", value: totalApartments, icon: "🏠" },
          { label: "Ocupados", value: occupiedSpots, icon: "🔴", color: "hsl(0, 72%, 60%)" },
          { label: "Libres", value: totalApartments - occupiedSpots, icon: "🟢", color: "hsl(142, 71%, 60%)" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: "1rem", textAlign: "center" }}>
            <p style={{ fontSize: "1.375rem", marginBottom: "0.25rem" }}>{s.icon}</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color ?? "hsl(210, 40%, 98%)" }}>{s.value}</p>
            <p style={{ fontSize: "0.75rem", color: "hsl(215, 25%, 55%)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bloques */}
      {blocksList.length === 0 ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center", color: "hsl(215, 25%, 45%)" }}>
          <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.75rem" }}>🏗️</span>
          <p style={{ fontWeight: 600 }}>No hay bloques configurados</p>
          <p style={{ fontSize: "0.8125rem", marginTop: "0.25rem" }}>
            Usa la "Configuración Masiva" para generarlos rápidamente.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1.25rem" }}>
          {blocksList.map((block) => {
            const occupiedInBlock = block.apartments.filter((a: any) => a.parkingOccupied).length;
            return (
              <div key={block.id} className="card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "hsl(210, 40%, 98%)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    🏗️ {block.name}
                  </h2>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span className="badge badge-neutral">{block.apartments.length} unidades</span>
                    {occupiedInBlock > 0 && (
                      <span className="badge badge-danger">🔴 {occupiedInBlock} ocupado{occupiedInBlock !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "0.5rem" }}>
                  {block.apartments.map((apt: any) => (
                    <div
                      key={apt.id}
                      style={{
                        padding: "0.625rem",
                        borderRadius: "0.5rem",
                        border: `1px solid ${apt.parkingOccupied ? "hsl(0, 72%, 30%)" : "hsl(220, 20%, 22%)"}`,
                        background: apt.parkingOccupied ? "hsl(0, 60%, 8%)" : "hsl(220, 35%, 11%)",
                        textAlign: "center",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: apt.parkingOccupied ? "hsl(0, 72%, 65%)" : "hsl(210, 40%, 85%)" }}>
                        {apt.number}
                      </p>
                      <p style={{ fontSize: "0.625rem", marginTop: "0.25rem", color: apt.parkingOccupied ? "hsl(0, 72%, 50%)" : "hsl(142, 71%, 50%)" }}>
                        {apt.parkingOccupied ? "Ocupado" : "Libre"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showBulkConfig && (
        <BulkConfigModal
          tenantId={tenantId}
          complexId={complexId}
          onClose={() => setShowBulkConfig(false)}
          onSuccess={(res) => {
            setShowBulkConfig(false);
            toast.success(`Se crearon ${res.createdBlocks} bloques y ${res.createdApartments} unidades.`);
          }}
        />
      )}
    </div>
  );
}
