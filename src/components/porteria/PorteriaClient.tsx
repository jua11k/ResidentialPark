"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  Car,
  User,
  Building2,
  Phone,
  Mail,
  Hash,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { getVehicleByPlacaAction, registerEntryAction, registerExitAction, getActiveParkingAction } from "@/actions/parking-actions";
import { formatDate, formatDuration, getVehicleIcon } from "@/lib/utils";

interface PorteriaClientProps {
  tenantId: string;
  complexId: string;
  complexName: string;
  tenantSlug: string;
}

type VehicleInfo = {
  id: string;
  placa: string;
  tipo: string;
  brand?: string | null;
  color?: string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  apartment?: {
    id: string;
    number: string;
    parkingOccupied: boolean;
    block?: { name: string } | null;
  } | null;
};

type ActiveRecord = {
  id: string;
  entryTime: string;
  vehicle: VehicleInfo;
};

export default function PorteriaClient({ tenantId, complexId, complexName }: PorteriaClientProps) {
  const [placa, setPlaca] = useState("");
  const [mode, setMode] = useState<"entry" | "exit">("entry");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeRecords, setActiveRecords] = useState<ActiveRecord[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Cargar vehículos activos ──────────────────────────────────────────────
  const loadActiveParking = useCallback(async () => {
    const result = await getActiveParkingAction(tenantId, complexId);
    if (result.success) {
      setActiveRecords(result.data || []);
    }
    setLoadingActive(false);
  }, [tenantId, complexId]);

  useEffect(() => {
    loadActiveParking();
    // Refrescar cada 30 segundos
    const interval = setInterval(loadActiveParking, 30_000);
    return () => clearInterval(interval);
  }, [loadActiveParking]);

  // ─── Autocompletado por placa ──────────────────────────────────────────────
  useEffect(() => {
    const val = placa.trim().toUpperCase();
    if (val.length < 3) {
      setVehicleInfo(null);
      setNotFound(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const result = await getVehicleByPlacaAction(tenantId, val);
      setSearching(false);
      if (result.success) {
        if (result.data) {
          setVehicleInfo(result.data);
          setNotFound(false);
        } else {
          setVehicleInfo(null);
          setNotFound(true);
        }
      }
    }, 400);
  }, [placa, tenantId]);

  // ─── Registrar Ingreso ─────────────────────────────────────────────────────
  async function handleEntry() {
    if (!vehicleInfo) return;
    setSubmitting(true);
    const result = await registerEntryAction(tenantId, {
      vehicleId: vehicleInfo.id,
      complexId,
    });
    setSubmitting(false);
    if (result.success) {
      toast.success(`✅ Ingreso registrado: ${vehicleInfo.placa}`);
      setPlaca("");
      setVehicleInfo(null);
      setNotFound(false);
      loadActiveParking();
    } else {
      toast.error(result.error ?? "Error al registrar el ingreso.");
    }
  }

  // ─── Registrar Salida ──────────────────────────────────────────────────────
  async function handleExit() {
    const val = placa.trim().toUpperCase();
    if (!val) return;
    setSubmitting(true);
    const result = await registerExitAction(tenantId, { placa: val });
    setSubmitting(false);
    if (result.success) {
      toast.success(`🚗 Salida registrada: ${val}`);
      setPlaca("");
      setVehicleInfo(null);
      setNotFound(false);
      loadActiveParking();
    } else {
      toast.error(result.error ?? "Error al registrar la salida.");
    }
  }

  const canSubmitEntry = vehicleInfo && !vehicleInfo.apartment?.parkingOccupied;

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(210, 40%, 98%)", letterSpacing: "-0.02em" }}>
            🏢 Portería
          </h1>
          <p style={{ color: "hsl(215, 25%, 55%)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {complexName} · {activeRecords.length} vehículo{activeRecords.length !== 1 ? "s" : ""} dentro
          </p>
        </div>
        <button onClick={loadActiveParking} className="btn-secondary" style={{ padding: "0 0.875rem" }}>
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      {/* Mode Switcher + Search */}
      <div className="card" style={{ padding: "1.5rem" }}>
        {/* Tabs Ingreso / Salida */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1.25rem",
            background: "hsl(220, 35%, 14%)",
            borderRadius: "0.625rem",
            padding: "0.25rem",
          }}
        >
          {(["entry", "exit"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setVehicleInfo(null); setNotFound(false); setPlaca(""); }}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                minHeight: "44px",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 600,
                transition: "all 0.2s ease",
                background: mode === m
                  ? m === "entry"
                    ? "hsl(142, 71%, 20%)"
                    : "hsl(0, 60%, 20%)"
                  : "transparent",
                color: mode === m
                  ? m === "entry"
                    ? "hsl(142, 71%, 65%)"
                    : "hsl(0, 72%, 65%)"
                  : "hsl(215, 25%, 55%)",
                boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
              }}
            >
              {m === "entry" ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
              {m === "entry" ? "Registrar Ingreso" : "Registrar Salida"}
            </button>
          ))}
        </div>

        {/* Buscador de Placa */}
        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <label className="input-label">Placa del vehículo</label>
          <div style={{ position: "relative" }}>
            <Search
              size={18}
              style={{
                position: "absolute", left: "0.875rem", top: "50%",
                transform: "translateY(-50%)", color: "hsl(215, 25%, 55%)", pointerEvents: "none",
              }}
            />
            {searching && (
              <Loader2
                size={16}
                style={{
                  position: "absolute", right: "0.875rem", top: "50%",
                  transform: "translateY(-50%)", color: "hsl(221, 83%, 60%)",
                  animation: "spin 0.7s linear infinite",
                }}
              />
            )}
            <input
              ref={inputRef}
              type="text"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="Ej: ABC123"
              className="input"
              style={{
                paddingLeft: "2.75rem",
                fontSize: "1.25rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
              autoFocus
              autoComplete="off"
              maxLength={10}
            />
          </div>
        </div>

        {/* Tarjeta de vehículo encontrado */}
        {vehicleInfo && (
          <div
            className="animate-fade-in"
            style={{
              background: "hsl(220, 35%, 12%)",
              border: "1px solid hsl(221, 83%, 30%)",
              borderRadius: "0.625rem",
              padding: "1.25rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "2rem" }}>{getVehicleIcon(vehicleInfo.tipo)}</span>
                <div>
                  <p style={{ fontWeight: 800, fontSize: "1.25rem", color: "hsl(210, 40%, 98%)", letterSpacing: "0.05em" }}>
                    {vehicleInfo.placa}
                  </p>
                  <p style={{ color: "hsl(215, 25%, 55%)", fontSize: "0.8125rem", textTransform: "capitalize" }}>
                    {vehicleInfo.tipo} {vehicleInfo.brand ? `· ${vehicleInfo.brand}` : ""} {vehicleInfo.color ? `· ${vehicleInfo.color}` : ""}
                  </p>
                </div>
              </div>
              {vehicleInfo.apartment?.parkingOccupied && mode === "entry" ? (
                <span className="badge badge-danger">
                  <XCircle size={12} />
                  Parqueadero ocupado
                </span>
              ) : (
                <span className="badge badge-success">
                  <CheckCircle2 size={12} />
                  Disponible
                </span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.8125rem" }}>
              {vehicleInfo.ownerName && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "hsl(215, 25%, 70%)" }}>
                  <User size={14} style={{ flexShrink: 0 }} />
                  <span>{vehicleInfo.ownerName}</span>
                </div>
              )}
              {vehicleInfo.apartment && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "hsl(215, 25%, 70%)" }}>
                  <Building2 size={14} style={{ flexShrink: 0 }} />
                  <span>
                    {vehicleInfo.apartment.block?.name} · Apto {vehicleInfo.apartment.number}
                  </span>
                </div>
              )}
              {vehicleInfo.ownerPhone && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "hsl(215, 25%, 70%)" }}>
                  <Phone size={14} style={{ flexShrink: 0 }} />
                  <span>{vehicleInfo.ownerPhone}</span>
                </div>
              )}
              {vehicleInfo.ownerEmail && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "hsl(215, 25%, 70%)" }}>
                  <Mail size={14} style={{ flexShrink: 0 }} />
                  <span style={{ wordBreak: "break-all" }}>{vehicleInfo.ownerEmail}</span>
                </div>
              )}
            </div>

            {/* Advertencia si parqueadero ocupado */}
            {vehicleInfo.apartment?.parkingOccupied && mode === "entry" && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem",
                  background: "hsl(0, 60%, 8%)",
                  border: "1px solid hsl(0, 72%, 25%)",
                  borderRadius: "0.5rem",
                  fontSize: "0.8125rem",
                  color: "hsl(0, 72%, 65%)",
                }}
              >
                ⚠️ El parqueadero del <strong>Apto. {vehicleInfo.apartment?.number}</strong> ya está ocupado.
                Debe salir el otro vehículo registrado primero.
              </div>
            )}
          </div>
        )}

        {/* Placa no encontrada */}
        {notFound && !vehicleInfo && (
          <div
            className="animate-fade-in"
            style={{
              background: "hsl(38, 80%, 6%)",
              border: "1px solid hsl(38, 92%, 25%)",
              borderRadius: "0.625rem",
              padding: "1rem",
              marginBottom: "1rem",
              fontSize: "0.875rem",
              color: "hsl(38, 92%, 65%)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>🔍</span>
            <span>
              La placa <strong>{placa}</strong> no está registrada.
              {mode === "entry" && " Puede registrarla completando los datos del vehículo."}
            </span>
          </div>
        )}

        {/* Botón de acción */}
        {mode === "entry" ? (
          <button
            onClick={handleEntry}
            disabled={!vehicleInfo || submitting || vehicleInfo?.apartment?.parkingOccupied}
            className="btn-success"
            style={{ width: "100%" }}
          >
            {submitting ? (
              <><Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} /> Registrando ingreso...</>
            ) : (
              <><ArrowDownCircle size={16} /> Confirmar Ingreso</>
            )}
          </button>
        ) : (
          <button
            onClick={handleExit}
            disabled={!placa.trim() || submitting}
            className="btn-danger"
            style={{ width: "100%" }}
          >
            {submitting ? (
              <><Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} /> Registrando salida...</>
            ) : (
              <><ArrowUpCircle size={16} /> Confirmar Salida</>
            )}
          </button>
        )}
      </div>

      {/* Lista de vehículos actualmente dentro */}
      <div>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "hsl(210, 40%, 98%)", marginBottom: "1rem" }}>
          Vehículos dentro del parqueadero
          <span
            style={{
              marginLeft: "0.5rem",
              background: "hsl(221, 83%, 20%)",
              color: "hsl(221, 83%, 75%)",
              borderRadius: "9999px",
              padding: "0.125rem 0.625rem",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            {activeRecords.length}
          </span>
        </h2>

        {loadingActive ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
            <div className="spinner" />
          </div>
        ) : activeRecords.length === 0 ? (
          <div
            className="card"
            style={{ padding: "2.5rem", textAlign: "center", color: "hsl(215, 25%, 45%)" }}
          >
            <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.75rem" }}>🅿️</span>
            <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Parqueadero vacío</p>
            <p style={{ fontSize: "0.8125rem" }}>No hay vehículos registrados actualmente</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "0.625rem" }}>
            {activeRecords.map((record) => {
              const v = record.vehicle;
              const apt = v.apartment;
              return (
                <div
                  key={record.id}
                  className="card animate-slide-in"
                  style={{
                    padding: "1rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>{getVehicleIcon(v.tipo)}</span>

                  <div style={{ flex: 1, minWidth: "140px" }}>
                    <p style={{ fontWeight: 800, fontSize: "1.0625rem", color: "hsl(210, 40%, 98%)", letterSpacing: "0.05em" }}>
                      {v.placa}
                    </p>
                    <p style={{ color: "hsl(215, 25%, 55%)", fontSize: "0.75rem", textTransform: "capitalize" }}>
                      {v.tipo} {v.brand ? `· ${v.brand}` : ""}
                    </p>
                  </div>

                  {apt && (
                    <div style={{ fontSize: "0.8125rem" }}>
                      <p style={{ color: "hsl(215, 25%, 70%)" }}>
                        {apt.block?.name} · Apto {apt.number}
                      </p>
                      {v.ownerName && <p style={{ color: "hsl(215, 25%, 50%)" }}>{v.ownerName}</p>}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "hsl(142, 71%, 55%)", fontSize: "0.8125rem", flexShrink: 0 }}>
                    <Clock size={13} />
                    <span>{formatDate(record.entryTime)}</span>
                  </div>

                  <span className="badge badge-success animate-pulse-glow">
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                    Adentro
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
