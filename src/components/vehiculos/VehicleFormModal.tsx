"use client";

import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { createVehicleAction, updateVehicleAction } from "@/actions/vehicle-actions";

interface VehicleFormModalProps {
  tenantId: string;
  complexId: string;
  blocks: any[];
  vehicle?: any; // null = crear, objeto = editar
  onClose: () => void;
  onSuccess: (vehicle: any) => void;
}

const TIPOS = ["carro", "moto", "camioneta", "bicicleta"] as const;

export default function VehicleFormModal({
  tenantId,
  complexId,
  blocks,
  vehicle,
  onClose,
  onSuccess,
}: VehicleFormModalProps) {
  const isEdit = !!vehicle;
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [selectedBlockId, setSelectedBlockId] = useState(vehicle?.apartment?.block?.id ?? "");
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
  const apartments = selectedBlock?.apartments ?? [];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);

    const rawData = {
      placa: fd.get("placa"),
      tipo: fd.get("tipo"),
      brand: fd.get("brand"),
      color: fd.get("color"),
      model: fd.get("model"),
      ownerName: fd.get("ownerName"),
      ownerPhone: fd.get("ownerPhone"),
      ownerEmail: fd.get("ownerEmail"),
      apartmentId: fd.get("apartmentId"),
      complexId,
      tenantId,
    };

    setSubmitting(true);
    const result = isEdit
      ? await updateVehicleAction(tenantId, vehicle.id, rawData)
      : await createVehicleAction(tenantId, rawData);
    setSubmitting(false);

    if (result.success) {
      onSuccess(result.data);
    } else {
      if (result.validationErrors) {
        const errs: Record<string, string> = {};
        for (const [k, v] of Object.entries(result.validationErrors)) {
          errs[k] = (v as string[])[0];
        }
        setErrors(errs);
      }
      if (result.error && !result.validationErrors) {
        setErrors({ _general: result.error });
      }
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
          <h2 style={{ fontWeight: 800, fontSize: "1.125rem", color: "hsl(210, 40%, 98%)" }}>
            {isEdit ? `✏️ Editar Vehículo` : "➕ Registrar Vehículo"}
          </h2>
          <button onClick={onClose} className="btn-secondary" style={{ padding: "0 0.5rem", minHeight: "36px" }}>
            <X size={16} />
          </button>
        </div>

        {errors._general && (
          <div style={{ background: "hsl(0, 60%, 8%)", border: "1px solid hsl(0, 72%, 25%)", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1rem", color: "hsl(0, 72%, 65%)", fontSize: "0.875rem" }}>
            {errors._general}
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Placa */}
          <div>
            <label className="input-label">Placa *</label>
            <input
              name="placa"
              type="text"
              defaultValue={vehicle?.placa}
              className={`input ${errors.placa ? "error" : ""}`}
              placeholder="Ej: ABC123"
              style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em" }}
              disabled={isEdit}
              required
            />
            {errors.placa && <p className="input-error">{errors.placa}</p>}
          </div>

          {/* Tipo */}
          <div>
            <label className="input-label">Tipo de vehículo *</label>
            <select name="tipo" defaultValue={vehicle?.tipo ?? "carro"} className="input select" required>
              {TIPOS.map((t) => (
                <option key={t} value={t} style={{ textTransform: "capitalize" }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="input-label">Marca</label>
              <input name="brand" type="text" defaultValue={vehicle?.brand ?? ""} className="input" placeholder="Chevrolet, Toyota..." />
            </div>
            <div>
              <label className="input-label">Color</label>
              <input name="color" type="text" defaultValue={vehicle?.color ?? ""} className="input" placeholder="Blanco, Negro..." />
            </div>
          </div>

          <div>
            <label className="input-label">Modelo/Referencia</label>
            <input name="model" type="text" defaultValue={vehicle?.model ?? ""} className="input" placeholder="Spark GT 2022..." />
          </div>

          <hr className="divider" />

          {/* Bloque + Apartamento */}
          {!isEdit && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label className="input-label">Bloque/Torre *</label>
                <select
                  value={selectedBlockId}
                  onChange={(e) => setSelectedBlockId(e.target.value)}
                  className="input select"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {blocks.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Apartamento *</label>
                <select name="apartmentId" className="input select" required disabled={!selectedBlockId}>
                  <option value="">Seleccionar...</option>
                  {apartments.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.number} {a.parkingOccupied ? "🔴" : "🟢"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {isEdit && (
            <input type="hidden" name="apartmentId" value={vehicle?.apartmentId} />
          )}

          <hr className="divider" />

          {/* Propietario */}
          <div>
            <label className="input-label">Nombre del propietario</label>
            <input
              name="ownerName"
              type="text"
              defaultValue={vehicle?.ownerName ?? ""}
              className={`input ${errors.ownerName ? "error" : ""}`}
              placeholder="Juan Pérez"
            />
            {errors.ownerName && <p className="input-error">{errors.ownerName}</p>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="input-label">Teléfono</label>
              <input name="ownerPhone" type="tel" defaultValue={vehicle?.ownerPhone ?? ""} className="input" placeholder="3001234567" />
            </div>
            <div>
              <label className="input-label">Correo electrónico</label>
              <input
                name="ownerEmail"
                type="email"
                defaultValue={vehicle?.ownerEmail ?? ""}
                className={`input ${errors.ownerEmail ? "error" : ""}`}
                placeholder="juan@email.com"
              />
              {errors.ownerEmail && <p className="input-error">{errors.ownerEmail}</p>}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1 }}>
              {submitting ? (
                <><Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} /> Guardando...</>
              ) : (
                <><Save size={16} /> {isEdit ? "Actualizar" : "Registrar"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
