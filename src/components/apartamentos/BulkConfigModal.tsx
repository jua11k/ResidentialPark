"use client";

import { useState } from "react";
import { Plus, X, Loader2, Settings, Building } from "lucide-react";
import { toast } from "sonner";
import { createBulkApartmentsAction } from "@/actions/apartment-actions";
import type { BulkConfig } from "@/services/apartment-service";

interface BulkConfigModalProps {
  tenantId: string;
  complexId: string;
  onClose: () => void;
  onSuccess: (result: { createdBlocks: number; createdApartments: number }) => void;
}

export default function BulkConfigModal({
  tenantId,
  complexId,
  onClose,
  onSuccess,
}: BulkConfigModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // Configuraciones
  const [blockNamesText, setBlockNamesText] = useState("A, B, C, D");
  
  const [configType, setConfigType] = useState<"floor-based" | "sequential">("floor-based");
  
  // Floor based
  const [floors, setFloors] = useState(5);
  const [unitsPerFloor, setUnitsPerFloor] = useState(4);
  const [unitDigits, setUnitDigits] = useState(2);
  
  // Sequential
  const [totalUnits, setTotalUnits] = useState(20);

  const blockNames = blockNamesText
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  async function handleSubmit() {
    if (blockNames.length === 0) {
      toast.error("Debe ingresar al menos un bloque.");
      return;
    }

    const config: BulkConfig = configType === "floor-based"
      ? { type: "floor-based", floors, unitsPerFloor, unitDigits }
      : { type: "sequential", totalUnits };

    setSubmitting(true);
    const result = await createBulkApartmentsAction(tenantId, complexId, blockNames, config, 2);
    setSubmitting(false);

    if (result.success && result.data) {
      onSuccess(result.data);
    } else {
      toast.error(result.error ?? "Ocurrió un error");
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="card animate-fade-in"
        style={{ width: "100%", maxWidth: "540px", maxHeight: "90vh", overflowY: "auto", padding: "1.5rem" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h2 style={{ fontWeight: 800, fontSize: "1.125rem", color: "hsl(210, 40%, 98%)", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Settings size={18} /> Configuración Masiva
          </h2>
          <button onClick={onClose} className="btn-secondary" style={{ padding: "0 0.5rem", minHeight: "36px" }}>
            <X size={16} />
          </button>
        </div>

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label className="input-label">Nombres de Bloques / Torres / Manzanas *</label>
              <p style={{ fontSize: "0.75rem", color: "hsl(215, 25%, 60%)", marginBottom: "0.5rem" }}>
                Sepáralos por comas. Ej: A, B, C o Manzana 1, Manzana 2
              </p>
              <textarea
                value={blockNamesText}
                onChange={(e) => setBlockNamesText(e.target.value)}
                className="input"
                style={{ minHeight: "80px", resize: "vertical" }}
                placeholder="A, B, C, D..."
              />
            </div>

            <div>
              <label className="input-label">Tipo de Distribución *</label>
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", color: "hsl(210, 40%, 98%)", fontSize: "0.875rem" }}>
                  <input
                    type="radio"
                    checked={configType === "floor-based"}
                    onChange={() => setConfigType("floor-based")}
                  />
                  Por Pisos (Ej: Apto 101, 102)
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", color: "hsl(210, 40%, 98%)", fontSize: "0.875rem" }}>
                  <input
                    type="radio"
                    checked={configType === "sequential"}
                    onChange={() => setConfigType("sequential")}
                  />
                  Secuencial (Ej: Casa 1, Casa 2)
                </label>
              </div>
            </div>

            {configType === "floor-based" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="input-label">Pisos por Bloque</label>
                  <input
                    type="number"
                    min={1}
                    value={floors}
                    onChange={(e) => setFloors(parseInt(e.target.value) || 1)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="input-label">Aptos por Piso</label>
                  <input
                    type="number"
                    min={1}
                    value={unitsPerFloor}
                    onChange={(e) => setUnitsPerFloor(parseInt(e.target.value) || 1)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="input-label">Formato (Ej)</label>
                  <select 
                    value={unitDigits} 
                    onChange={(e) => setUnitDigits(parseInt(e.target.value))}
                    className="input select"
                    style={{ padding: "0.5rem" }}
                  >
                    <option value={2}>101</option>
                    <option value={3}>1001</option>
                    <option value={4}>10001</option>
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="input-label">Unidades por Bloque/Manzana</label>
                <input
                  type="number"
                  min={1}
                  value={totalUnits}
                  onChange={(e) => setTotalUnits(parseInt(e.target.value) || 1)}
                  className="input"
                />
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={blockNames.length === 0}
              className="btn-primary"
              style={{ marginTop: "0.5rem" }}
            >
              Continuar
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ background: "hsl(220, 35%, 12%)", padding: "1rem", borderRadius: "0.5rem", border: "1px solid hsl(220, 20%, 25%)" }}>
              <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "hsl(210, 40%, 98%)", marginBottom: "0.5rem" }}>
                Vista Previa de Creación
              </h3>
              
              <ul style={{ fontSize: "0.8125rem", color: "hsl(215, 25%, 70%)", display: "flex", flexDirection: "column", gap: "0.375rem", listStyle: "disc", paddingLeft: "1.25rem", marginBottom: "1rem" }}>
                <li><strong>Bloques/Manzanas a crear:</strong> {blockNames.length} ({blockNames.slice(0,3).join(", ")}{blockNames.length > 3 ? "..." : ""})</li>
                
                {configType === "floor-based" ? (
                  <>
                    <li><strong>Estructura:</strong> {floors} pisos con {unitsPerFloor} aptos por piso.</li>
                    <li><strong>Total por bloque:</strong> {floors * unitsPerFloor} apartamentos.</li>
                    <li><strong>Ejemplo de numeración:</strong> 1{String(1).padStart(unitDigits, '0')}, 1{String(2).padStart(unitDigits, '0')} ... {floors}{String(unitsPerFloor).padStart(unitDigits, '0')}.</li>
                  </>
                ) : (
                  <>
                    <li><strong>Estructura:</strong> Secuencial directa.</li>
                    <li><strong>Total por bloque:</strong> {totalUnits} unidades.</li>
                    <li><strong>Ejemplo de numeración:</strong> 1, 2, 3 ... {totalUnits}.</li>
                  </>
                )}
              </ul>

              <div style={{ background: "hsl(142, 60%, 10%)", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid hsl(142, 71%, 30%)", color: "hsl(142, 71%, 65%)", fontSize: "0.875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Building size={16} />
                Total a crear: {blockNames.length * (configType === "floor-based" ? (floors * unitsPerFloor) : totalUnits)} unidades.
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="button" onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1 }}>
                Atrás
              </button>
              <button type="button" onClick={handleSubmit} disabled={submitting} className="btn-primary" style={{ flex: 1 }}>
                {submitting ? (
                  <><Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} /> Procesando...</>
                ) : (
                  <><Plus size={16} /> Confirmar Creación</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
