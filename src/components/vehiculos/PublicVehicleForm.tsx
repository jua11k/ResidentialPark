"use client";

import { useState } from "react";
import { registerPublicVehicleAction } from "@/actions/vehicle-actions";
import { Loader2, CarFront, CheckCircle2 } from "lucide-react";

interface PublicVehicleFormProps {
  tenantId: string;
  blocks: any[];
}

const TIPOS = ["carro", "moto", "camioneta", "bicicleta"] as const;

export default function PublicVehicleForm({ tenantId, blocks }: PublicVehicleFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [selectedBlockId, setSelectedBlockId] = useState("");
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
      tenantId, // Needed to satisfy schema if we pass the whole object
    };

    setSubmitting(true);
    const result = await registerPublicVehicleAction(tenantId, rawData);
    setSubmitting(false);

    if (result.success) {
      setSuccess(true);
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

  if (success) {
    return (
      <div className="card animate-fade-in" style={{ padding: "3rem 2rem", textAlign: "center", maxWidth: "480px", margin: "0 auto" }}>
        <CheckCircle2 size={64} style={{ color: "hsl(142, 71%, 45%)", margin: "0 auto 1.5rem" }} />
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(210, 40%, 98%)", marginBottom: "1rem" }}>
          ¡Vehículo registrado exitosamente!
        </h2>
        <p style={{ color: "hsl(215, 25%, 65%)", marginBottom: "2rem" }}>
          Tu vehículo ha sido registrado en el sistema del conjunto. Ya puedes ingresar al parqueadero.
        </p>
        <button onClick={() => { setSuccess(false); setSelectedBlockId(""); }} className="btn-primary" style={{ width: "100%" }}>
          Registrar otro vehículo
        </button>
      </div>
    );
  }

  return (
    <div className="card animate-fade-in" style={{ width: "100%", maxWidth: "540px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div style={{ padding: "0.75rem", background: "hsl(221, 83%, 15%)", borderRadius: "0.75rem", color: "hsl(221, 83%, 65%)" }}>
          <CarFront size={24} />
        </div>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: "1.25rem", color: "hsl(210, 40%, 98%)" }}>Registro de Vehículo</h2>
          <p style={{ fontSize: "0.875rem", color: "hsl(215, 25%, 55%)" }}>Complete los datos para registrar su vehículo.</p>
        </div>
      </div>

      {errors._general && (
        <div style={{ background: "hsl(0, 60%, 8%)", border: "1px solid hsl(0, 72%, 25%)", borderRadius: "0.5rem", padding: "1rem", marginBottom: "1.5rem", color: "hsl(0, 72%, 65%)", fontSize: "0.875rem", fontWeight: 500 }}>
          {errors._general}
        </div>
      )}

      <form noValidate onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        
        {/* Bloque + Apartamento */}
        <div style={{ background: "hsl(220, 35%, 12%)", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid hsl(220, 20%, 25%)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
            <select name="apartmentId" className={`input select ${errors.apartmentId ? "error" : ""}`} required disabled={!selectedBlockId}>
              <option value="">Seleccionar...</option>
              {apartments.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.number}
                </option>
              ))}
            </select>
            {errors.apartmentId && <p className="input-error" style={{ marginTop: "0.25rem" }}>{errors.apartmentId}</p>}
          </div>
        </div>

        {/* Placa y Tipo */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
          <div>
            <label className="input-label">Placa *</label>
            <input
              name="placa"
              type="text"
              className={`input ${errors.placa ? "error" : ""}`}
              placeholder="Ej: ABC123"
              style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", fontSize: "1.125rem" }}
              required
            />
            {errors.placa && <p className="input-error">{errors.placa}</p>}
          </div>
          <div>
            <label className="input-label">Tipo *</label>
            <select name="tipo" className="input select" required>
              {TIPOS.map((t) => (
                <option key={t} value={t} style={{ textTransform: "capitalize" }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Marca, Color, Modelo */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label className="input-label">Marca</label>
            <input name="brand" type="text" className="input" placeholder="Chevrolet, Toyota..." />
          </div>
          <div>
            <label className="input-label">Color</label>
            <input name="color" type="text" className="input" placeholder="Blanco, Negro..." />
          </div>
        </div>

        <div>
          <label className="input-label">Modelo/Referencia</label>
          <input name="model" type="text" className="input" placeholder="Spark GT 2022..." />
        </div>

        <hr className="divider" />

        {/* Propietario */}
        <div>
          <label className="input-label">Nombre del propietario</label>
          <input
            name="ownerName"
            type="text"
            className={`input ${errors.ownerName ? "error" : ""}`}
            placeholder="Juan Pérez"
          />
          {errors.ownerName && <p className="input-error">{errors.ownerName}</p>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label className="input-label">Teléfono</label>
            <input name="ownerPhone" type="tel" className="input" placeholder="3001234567" />
          </div>
          <div>
            <label className="input-label">Correo electrónico</label>
            <input
              name="ownerEmail"
              type="email"
              className={`input ${errors.ownerEmail ? "error" : ""}`}
              placeholder="juan@email.com"
            />
            {errors.ownerEmail && <p className="input-error">{errors.ownerEmail}</p>}
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary" style={{ marginTop: "1rem", height: "48px", fontSize: "1.05rem" }}>
          {submitting ? (
            <><Loader2 size={18} style={{ animation: "spin 0.7s linear infinite" }} /> Procesando...</>
          ) : (
            "Registrar Vehículo"
          )}
        </button>
      </form>
    </div>
  );
}
