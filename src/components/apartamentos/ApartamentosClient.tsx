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
  parkingData: {
    car: { total: number | null; occupied: number };
    moto: { total: number | null; occupied: number };
    bike: { total: number | null; occupied: number };
  };
}

export default function ApartamentosClient({
  tenantId,
  complexId,
  complexName,
  blocksList,
  totalApartments,
  parkingData,
}: ApartamentosClientProps) {
  const [showBulkConfig, setShowBulkConfig] = useState(false);
  const [selectedApt, setSelectedApt] = useState<any | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [isBlocking, setIsBlocking] = useState(false);

  // Calcular la capacidad de parqueaderos (si es null asume totalApartments)
  const carTotal = parkingData.car.total ?? totalApartments;
  const motoTotal = parkingData.moto.total ?? totalApartments;
  const bikeTotal = parkingData.bike.total ?? totalApartments;

  async function handleBlock() {
    if (!selectedApt) return;
    if (!selectedApt.accessBlocked && blockReason.trim().length < 3) {
      toast.error("El motivo debe tener al menos 3 caracteres.");
      return;
    }

    setIsBlocking(true);
    try {
      const { blockApartmentAccessAction, unblockApartmentAccessAction } = await import("@/actions/apartment-actions");
      
      let res;
      if (selectedApt.accessBlocked) {
        res = await unblockApartmentAccessAction(tenantId, selectedApt.id);
      } else {
        res = await blockApartmentAccessAction(tenantId, selectedApt.id, { blockReason });
      }

      if (res.success) {
        toast.success(selectedApt.accessBlocked ? "Apartamento desbloqueado" : "Apartamento bloqueado");
        setSelectedApt(null);
        setBlockReason("");
      } else {
        toast.error(res.error || "Error al cambiar estado de acceso");
      }
    } catch (e) {
      toast.error("Error inesperado");
    } finally {
      setIsBlocking(false);
    }
  }

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

      {/* Stats Fila 1: Resumen General */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
        <div className="card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ fontSize: "2rem", background: "hsl(220, 20%, 15%)", padding: "0.5rem", borderRadius: "0.5rem" }}>🏗️</div>
          <div>
            <p style={{ fontSize: "0.875rem", color: "hsl(215, 25%, 55%)", fontWeight: 600 }}>Total Bloques</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(210, 40%, 98%)", lineHeight: 1 }}>{blocksList.length}</p>
          </div>
        </div>
        <div className="card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ fontSize: "2rem", background: "hsl(220, 20%, 15%)", padding: "0.5rem", borderRadius: "0.5rem" }}>🏠</div>
          <div>
            <p style={{ fontSize: "0.875rem", color: "hsl(215, 25%, 55%)", fontWeight: 600 }}>Total Apartamentos</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(210, 40%, 98%)", lineHeight: 1 }}>{totalApartments}</p>
          </div>
        </div>
      </div>

      {/* Stats Fila 2: Capacidad de Parqueaderos */}
      <div>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "hsl(210, 40%, 98%)", marginBottom: "0.75rem" }}>Capacidad de Parqueaderos</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "0.75rem" }}>
          {[
            { label: "Carros", icon: "🚗", total: carTotal, occupied: parkingData.car.occupied },
            { label: "Motos", icon: "🏍️", total: motoTotal, occupied: parkingData.moto.occupied },
            { label: "Bicicletas", icon: "🚲", total: bikeTotal, occupied: parkingData.bike.occupied },
          ].map((v) => {
            const free = Math.max(0, v.total - v.occupied);
            return (
              <div key={v.label} className="card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.5rem" }}>{v.icon}</span>
                    <span style={{ fontWeight: 700, color: "hsl(210, 40%, 98%)" }}>{v.label}</span>
                  </div>
                  <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "hsl(215, 25%, 65%)", background: "hsl(220, 20%, 15%)", padding: "0.25rem 0.625rem", borderRadius: "1rem" }}>
                    Total: {v.total}
                  </span>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <div style={{ background: "hsl(0, 60%, 12%)", border: "1px solid hsl(0, 72%, 25%)", borderRadius: "0.5rem", padding: "0.5rem", textAlign: "center" }}>
                    <p style={{ fontSize: "0.75rem", color: "hsl(0, 72%, 65%)", fontWeight: 600, marginBottom: "0.125rem" }}>Ocupados</p>
                    <p style={{ fontSize: "1.125rem", color: "hsl(0, 72%, 65%)", fontWeight: 800 }}>{v.occupied}</p>
                  </div>
                  <div style={{ background: "hsl(142, 71%, 12%)", border: "1px solid hsl(142, 71%, 25%)", borderRadius: "0.5rem", padding: "0.5rem", textAlign: "center" }}>
                    <p style={{ fontSize: "0.75rem", color: "hsl(142, 71%, 45%)", fontWeight: 600, marginBottom: "0.125rem" }}>Libres</p>
                    <p style={{ fontSize: "1.125rem", color: "hsl(142, 71%, 45%)", fontWeight: 800 }}>{free}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
                    <button
                      type="button"
                      onClick={() => { setSelectedApt(apt); setBlockReason(apt.blockReason || ""); }}
                      key={apt.id}
                      style={{
                        padding: "0.625rem",
                        borderRadius: "0.5rem",
                        border: `1px solid ${apt.accessBlocked ? "hsl(0, 72%, 35%)" : apt.parkingOccupied ? "hsl(35, 100%, 30%)" : "hsl(220, 20%, 22%)"}`,
                        background: apt.accessBlocked ? "hsl(0, 60%, 12%)" : apt.parkingOccupied ? "hsl(35, 100%, 8%)" : "hsl(220, 35%, 11%)",
                        textAlign: "center",
                        transition: "all 0.15s ease",
                        cursor: "pointer",
                        position: "relative",
                      }}
                    >
                      {apt.accessBlocked && (
                        <div style={{ position: "absolute", top: "-5px", right: "-5px", background: "hsl(0, 72%, 45%)", borderRadius: "50%", padding: "2px", fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", boxShadow: "0 0 5px rgba(0,0,0,0.5)" }}>
                          🔒
                        </div>
                      )}
                      <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: apt.accessBlocked ? "hsl(0, 72%, 65%)" : apt.parkingOccupied ? "hsl(35, 100%, 65%)" : "hsl(210, 40%, 85%)" }}>
                        {apt.number}
                      </p>
                      <p style={{ fontSize: "0.625rem", marginTop: "0.25rem", color: apt.accessBlocked ? "hsl(0, 72%, 55%)" : apt.parkingOccupied ? "hsl(35, 100%, 55%)" : "hsl(142, 71%, 50%)" }}>
                        {apt.accessBlocked ? "Bloqueado" : apt.parkingOccupied ? "Ocupado" : "Libre"}
                      </p>
                    </button>
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

      {selectedApt && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={() => !isBlocking && setSelectedApt(null)} />
          <div style={{ background: "hsl(223, 47%, 10%)", border: "1px solid hsl(220, 20%, 22%)", borderRadius: "1rem", padding: "1.5rem", width: "100%", maxWidth: "400px", position: "relative", zIndex: 51 }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "white", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {selectedApt.accessBlocked ? "🔓 Desbloquear Apartamento" : "🔒 Bloquear Apartamento"} {selectedApt.number}
            </h2>
            <p style={{ fontSize: "0.875rem", color: "hsl(215, 25%, 65%)", marginBottom: "1.5rem" }}>
              {selectedApt.accessBlocked
                ? "El apartamento está bloqueado actualmente impidiendo el registro y entrada de vehículos."
                : "Al bloquear el apartamento, no se permitirán ingresos de vehículos asociados hasta que se levante el bloqueo."}
            </p>

            {selectedApt.accessBlocked ? (
              <div style={{ background: "hsl(0, 60%, 8%)", border: "1px solid hsl(0, 72%, 25%)", padding: "1rem", borderRadius: "0.5rem", marginBottom: "1.5rem" }}>
                <p style={{ fontSize: "0.75rem", color: "hsl(0, 72%, 65%)", fontWeight: 600, marginBottom: "0.25rem" }}>Motivo de bloqueo actual:</p>
                <p style={{ fontSize: "0.875rem", color: "white" }}>{selectedApt.blockReason}</p>
              </div>
            ) : (
              <div style={{ marginBottom: "1.5rem" }}>
                <label className="input-label">Motivo de bloqueo *</label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="input"
                  style={{ minHeight: "80px", resize: "vertical" }}
                  placeholder="Ej: Mora en la cuota de administración..."
                  required
                />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button type="button" onClick={() => setSelectedApt(null)} className="btn-secondary" disabled={isBlocking}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleBlock}
                className="btn-primary"
                style={{ background: selectedApt.accessBlocked ? "hsl(142, 71%, 45%)" : "hsl(0, 72%, 45%)", border: "none" }}
                disabled={isBlocking}
              >
                {isBlocking ? "Procesando..." : selectedApt.accessBlocked ? "Desbloquear" : "Bloquear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
