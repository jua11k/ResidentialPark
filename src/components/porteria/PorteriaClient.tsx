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
  Home,
} from "lucide-react";
import { toast } from "sonner";
import { 
  registerEntryAction, 
  registerExitAction, 
  getActiveParkingAction,
  getApartmentVehiclesAction,
  searchVehiclesAction
} from "@/actions/parking-actions";
import { formatDate, getVehicleIcon } from "@/lib/utils";

interface ApartmentOption {
  id: string;
  label: string;
  blockName: string;
  number: string;
}

interface PorteriaClientProps {
  tenantId: string;
  complexId: string;
  complexName: string;
  tenantSlug: string;
  initialApartments: ApartmentOption[];
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
  isInside: boolean;
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

// Hook simple para clicks fuera
function useOutsideClick(ref: React.RefObject<any>, callback: () => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
}

export default function PorteriaClient({ tenantId, complexId, complexName, initialApartments }: PorteriaClientProps) {
  const [submitting, setSubmitting] = useState(false);
  const [activeRecords, setActiveRecords] = useState<ActiveRecord[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);

  // Autocompletado de apartamentos
  const [aptQuery, setAptQuery] = useState("");
  const [showAptDropdown, setShowAptDropdown] = useState(false);
  const [selectedApt, setSelectedApt] = useState<ApartmentOption | null>(null);
  const aptDropdownRef = useRef<HTMLDivElement>(null);

  // Autocompletado de vehículos
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleInfo | null>(null);
  const [vehicleOptions, setVehicleOptions] = useState<VehicleInfo[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const vehicleDropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useOutsideClick(aptDropdownRef, () => setShowAptDropdown(false));
  useOutsideClick(vehicleDropdownRef, () => setShowVehicleDropdown(false));

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
    const interval = setInterval(loadActiveParking, 30_000);
    return () => clearInterval(interval);
  }, [loadActiveParking]);

  // ─── Lógica del Dropdown de Apartamentos ─────────────────────────────────────
  const filteredApts = initialApartments.filter(a => 
    a.label.toLowerCase().includes(aptQuery.toLowerCase())
  ).slice(0, 50);

  // Al seleccionar un apartamento, cargamos sus vehículos
  const handleSelectApt = async (apt: ApartmentOption) => {
    setSelectedApt(apt);
    setAptQuery(apt.label);
    setShowAptDropdown(false);
    
    // Reset vehicle selection
    setSelectedVehicle(null);
    setVehicleQuery("");
    
    setLoadingVehicles(true);
    const res = await getApartmentVehiclesAction(tenantId, apt.id);
    setLoadingVehicles(false);
    if (res.success && res.data) {
      setVehicleOptions(res.data);
      // Opcional: si solo hay un vehículo, autoseleccionarlo
      if (res.data.length === 1) {
        setSelectedVehicle(res.data[0]);
        setVehicleQuery(res.data[0].placa);
      } else if (res.data.length > 1) {
        // Abrir el dropdown para que elija
        setShowVehicleDropdown(true);
      } else {
        toast.info("No hay vehículos registrados en este apartamento.");
      }
    }
  };

  const handleClearApt = () => {
    setSelectedApt(null);
    setAptQuery("");
    // Limpiar también los vehículos si venían de este apto
    setSelectedVehicle(null);
    setVehicleQuery("");
    setVehicleOptions([]);
  };

  // ─── Lógica del Dropdown de Vehículos ────────────────────────────────────────
  useEffect(() => {
    // Si ya hay un apto seleccionado, las opciones ya están cargadas.
    // Solo hacemos busqueda full-text si no hay apto seleccionado.
    if (selectedApt) return;
    
    const val = vehicleQuery.trim();
    if (val.length < 2) {
      setVehicleOptions([]);
      return;
    }

    // Evitar buscar si el query coincide con el que ya tenemos seleccionado
    if (selectedVehicle && (val.toUpperCase() === selectedVehicle.placa.toUpperCase())) {
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingVehicles(true);
      const res = await searchVehiclesAction(tenantId, val);
      setLoadingVehicles(false);
      if (res.success && res.data) {
        setVehicleOptions(res.data);
      }
    }, 350);
  }, [vehicleQuery, tenantId, selectedApt, selectedVehicle]);

  const filteredVehicles = selectedApt 
    ? vehicleOptions.filter(v => 
        v.placa.toLowerCase().includes(vehicleQuery.toLowerCase()) || 
        (v.ownerName?.toLowerCase() || "").includes(vehicleQuery.toLowerCase())
      )
    : vehicleOptions;

  const handleSelectVehicle = (v: VehicleInfo) => {
    setSelectedVehicle(v);
    setVehicleQuery(v.placa);
    setShowVehicleDropdown(false);
    
    // Si no teníamos un apt seleccionado, podemos auto-completarlo visualmente
    if (!selectedApt && v.apartment) {
      const label = `${v.apartment.block?.name} · Apto ${v.apartment.number}`;
      setAptQuery(label);
      // No seteamos `selectedApt` full porque podríamos romper el dropdown, 
      // o sí, pero el usuario no lo buscó por ahí. Lo dejamos así nomás para feedback visual.
    }
  };

  const handleClearVehicle = () => {
    setSelectedVehicle(null);
    setVehicleQuery("");
    // Si había un apto seleccionado, volver a mostrar sus opciones
    if (selectedApt) {
      setShowVehicleDropdown(true);
    }
  };

  // ─── Registro de Ingreso / Salida ───────────────────────────────────────────
  async function handleAction() {
    if (!selectedVehicle) return;
    setSubmitting(true);

    if (selectedVehicle.isInside) {
      // Registrar SALIDA
      const res = await registerExitAction(tenantId, { placa: selectedVehicle.placa });
      if (res.success) {
        toast.success(`🚗 Salida registrada: ${selectedVehicle.placa}`);
        resetForm();
        loadActiveParking();
      } else {
        toast.error(res.error ?? "Error al registrar la salida.");
      }
    } else {
      // Registrar INGRESO
      const res = await registerEntryAction(tenantId, { vehicleId: selectedVehicle.id, complexId });
      if (res.success) {
        toast.success(`✅ Ingreso registrado: ${selectedVehicle.placa}`);
        resetForm();
        loadActiveParking();
      } else {
        toast.error(res.error ?? "Error al registrar el ingreso.");
      }
    }
    setSubmitting(false);
  }

  function resetForm() {
    setSelectedVehicle(null);
    setVehicleQuery("");
    setSelectedApt(null);
    setAptQuery("");
    setVehicleOptions([]);
  }

  // ─── Cálculos de UI ─────────────────────────────────────────────────────────
  const actionMode = selectedVehicle ? (selectedVehicle.isInside ? "exit" : "entry") : null;
  const disabledReason = (() => {
    if (!selectedVehicle) return "Seleccione un vehículo";
    if (actionMode === "entry" && selectedVehicle.apartment?.parkingOccupied) return "El parqueadero ya está ocupado";
    return null;
  })();

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

      {/* Tarjeta Principal de Movimientos */}
      <div className="card" style={{ padding: "1.5rem", overflow: "visible" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "white", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          Movimientos
        </h2>

        <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          
          {/* Autocomplete Apartamento */}
          <div style={{ position: "relative" }} ref={aptDropdownRef}>
            <label className="input-label" style={{ display: "flex", justifyContent: "space-between" }}>
              Apartamento
              {selectedApt && (
                <button onClick={handleClearApt} style={{ color: "hsl(0, 72%, 65%)", background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", padding: 0 }}>
                  Limpiar
                </button>
              )}
            </label>
            <div style={{ position: "relative" }}>
              <Home size={18} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "hsl(215, 25%, 55%)", pointerEvents: "none" }} />
              <input
                type="text"
                className="input"
                placeholder="Ej: Torre 1 Apto 101"
                value={aptQuery}
                onChange={(e) => { setAptQuery(e.target.value); setShowAptDropdown(true); setSelectedApt(null); }}
                onFocus={() => setShowAptDropdown(true)}
                style={{ paddingLeft: "2.5rem" }}
              />
            </div>

            {/* Dropdown Apartamentos */}
            {showAptDropdown && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, marginTop: "0.5rem",
                background: "hsl(220, 35%, 12%)", border: "1px solid hsl(220, 20%, 22%)", borderRadius: "0.5rem",
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)", maxHeight: "250px", overflowY: "auto",
              }}>
                {filteredApts.length === 0 ? (
                  <div style={{ padding: "0.75rem 1rem", color: "hsl(215, 25%, 55%)", fontSize: "0.875rem" }}>No se encontraron apartamentos.</div>
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: "0.25rem" }}>
                    {filteredApts.map(apt => (
                      <li
                        key={apt.id}
                        onClick={() => handleSelectApt(apt)}
                        style={{
                          padding: "0.625rem 0.75rem", cursor: "pointer", borderRadius: "0.25rem",
                          fontSize: "0.875rem", color: "hsl(210, 40%, 90%)",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(221, 83%, 20%)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {apt.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Autocomplete Vehículo */}
          <div style={{ position: "relative" }} ref={vehicleDropdownRef}>
            <label className="input-label" style={{ display: "flex", justifyContent: "space-between" }}>
              Vehículo (Placa / Propietario)
              {selectedVehicle && (
                <button onClick={handleClearVehicle} style={{ color: "hsl(0, 72%, 65%)", background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", padding: 0 }}>
                  Limpiar
                </button>
              )}
            </label>
            <div style={{ position: "relative" }}>
              <Car size={18} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "hsl(215, 25%, 55%)", pointerEvents: "none" }} />
              {loadingVehicles && (
                <Loader2 size={16} style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "hsl(221, 83%, 60%)", animation: "spin 0.7s linear infinite" }} />
              )}
              <input
                type="text"
                className="input"
                placeholder={selectedApt ? "Seleccione un vehículo..." : "Ej: ABC123"}
                value={vehicleQuery}
                onChange={(e) => { setVehicleQuery(e.target.value.toUpperCase()); setShowVehicleDropdown(true); setSelectedVehicle(null); }}
                onFocus={() => setShowVehicleDropdown(true)}
                style={{ paddingLeft: "2.5rem", textTransform: selectedVehicle ? "none" : "uppercase" }}
              />
            </div>

            {/* Dropdown Vehículos */}
            {showVehicleDropdown && (vehicleQuery.length >= 2 || selectedApt) && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, marginTop: "0.5rem",
                background: "hsl(220, 35%, 12%)", border: "1px solid hsl(220, 20%, 22%)", borderRadius: "0.5rem",
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)", maxHeight: "300px", overflowY: "auto",
              }}>
                {loadingVehicles ? (
                  <div style={{ padding: "0.75rem 1rem", color: "hsl(215, 25%, 55%)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> Buscando...
                  </div>
                ) : filteredVehicles.length === 0 ? (
                  <div style={{ padding: "0.75rem 1rem", color: "hsl(215, 25%, 55%)", fontSize: "0.875rem" }}>
                    {selectedApt ? "Este apartamento no tiene vehículos." : "No se encontraron vehículos."}
                  </div>
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: "0.25rem" }}>
                    {filteredVehicles.map(v => (
                      <li
                        key={v.id}
                        onClick={() => handleSelectVehicle(v)}
                        style={{
                          padding: "0.625rem 0.75rem", cursor: "pointer", borderRadius: "0.25rem",
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(221, 83%, 20%)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: "white", fontSize: "0.95rem" }}>{v.placa} <span style={{ fontWeight: 400, color: "hsl(215, 25%, 65%)", fontSize: "0.8rem", textTransform: "capitalize" }}>({v.tipo})</span></div>
                          <div style={{ fontSize: "0.75rem", color: "hsl(215, 25%, 70%)" }}>
                            {v.ownerName || "Sin propietario"} 
                            {!selectedApt && v.apartment ? ` · Apto ${v.apartment.number}` : ""}
                          </div>
                        </div>
                        {v.isInside ? (
                          <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", borderRadius: "1rem", background: "hsl(0, 60%, 20%)", color: "hsl(0, 72%, 65%)", border: "1px solid hsl(0, 72%, 35%)" }}>Adentro</span>
                        ) : (
                          <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", borderRadius: "1rem", background: "hsl(142, 71%, 15%)", color: "hsl(142, 71%, 45%)", border: "1px solid hsl(142, 71%, 25%)" }}>Afuera</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tarjeta del Vehículo Seleccionado */}
        {selectedVehicle && (
          <div className="animate-fade-in" style={{
            marginTop: "1.5rem", background: "hsl(220, 35%, 12%)",
            border: `1px solid ${actionMode === "entry" ? "hsl(142, 71%, 25%)" : "hsl(0, 72%, 35%)"}`,
            borderRadius: "0.625rem", padding: "1.25rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "2rem" }}>{getVehicleIcon(selectedVehicle.tipo)}</span>
                <div>
                  <p style={{ fontWeight: 800, fontSize: "1.25rem", color: "hsl(210, 40%, 98%)", letterSpacing: "0.05em" }}>
                    {selectedVehicle.placa}
                  </p>
                  <p style={{ color: "hsl(215, 25%, 55%)", fontSize: "0.8125rem", textTransform: "capitalize" }}>
                    {selectedVehicle.tipo} {selectedVehicle.brand ? `· ${selectedVehicle.brand}` : ""} {selectedVehicle.color ? `· ${selectedVehicle.color}` : ""}
                  </p>
                </div>
              </div>
              
              {selectedVehicle.isInside ? (
                <span className="badge badge-danger">
                  <ArrowUpCircle size={14} /> Vehículo Adentro
                </span>
              ) : selectedVehicle.apartment?.parkingOccupied ? (
                <span className="badge badge-danger">
                  <XCircle size={14} /> Parqueadero Ocupado
                </span>
              ) : (
                <span className="badge badge-success">
                  <CheckCircle2 size={14} /> Parqueadero Libre
                </span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.8125rem" }}>
              {selectedVehicle.ownerName && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "hsl(215, 25%, 70%)" }}>
                  <User size={14} style={{ flexShrink: 0 }} /> <span>{selectedVehicle.ownerName}</span>
                </div>
              )}
              {selectedVehicle.apartment && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "hsl(215, 25%, 70%)" }}>
                  <Building2 size={14} style={{ flexShrink: 0 }} />
                  <span>{selectedVehicle.apartment.block?.name} · Apto {selectedVehicle.apartment.number}</span>
                </div>
              )}
              {selectedVehicle.ownerPhone && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "hsl(215, 25%, 70%)" }}>
                  <Phone size={14} style={{ flexShrink: 0 }} /> <span>{selectedVehicle.ownerPhone}</span>
                </div>
              )}
            </div>

            {/* Advertencia Bloqueo de apto */}
            {actionMode === "entry" && selectedVehicle.apartment?.parkingOccupied && (
              <div style={{ marginTop: "1rem", padding: "0.75rem", background: "hsl(0, 60%, 8%)", border: "1px solid hsl(0, 72%, 25%)", borderRadius: "0.5rem", fontSize: "0.8125rem", color: "hsl(0, 72%, 65%)" }}>
                ⚠️ El parqueadero del <strong>Apto. {selectedVehicle.apartment.number}</strong> ya está ocupado.
              </div>
            )}

            {/* Botón Dinámico */}
            <div style={{ marginTop: "1.5rem" }}>
              <button
                onClick={handleAction}
                disabled={submitting || !!disabledReason}
                style={{
                  width: "100%", padding: "0.875rem", borderRadius: "0.5rem", border: "none",
                  fontWeight: 700, fontSize: "1rem", cursor: !!disabledReason ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  transition: "all 0.2s",
                  background: !!disabledReason 
                    ? "hsl(220, 20%, 20%)" 
                    : actionMode === "entry" ? "hsl(142, 71%, 35%)" : "hsl(0, 72%, 40%)",
                  color: !!disabledReason ? "hsl(215, 25%, 55%)" : "white",
                }}
              >
                {submitting ? (
                  <><Loader2 size={18} style={{ animation: "spin 0.7s linear infinite" }} /> Procesando...</>
                ) : !!disabledReason ? (
                  <>{disabledReason}</>
                ) : actionMode === "entry" ? (
                  <><ArrowDownCircle size={18} /> Registrar Ingreso</>
                ) : (
                  <><ArrowUpCircle size={18} /> Registrar Salida</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de vehículos actualmente dentro */}
      <div>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "hsl(210, 40%, 98%)", marginBottom: "1rem" }}>
          Vehículos dentro del parqueadero
          <span style={{ marginLeft: "0.5rem", background: "hsl(221, 83%, 20%)", color: "hsl(221, 83%, 75%)", borderRadius: "9999px", padding: "0.125rem 0.625rem", fontSize: "0.75rem", fontWeight: 700 }}>
            {activeRecords.length}
          </span>
        </h2>

        {loadingActive ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}><div className="spinner" /></div>
        ) : activeRecords.length === 0 ? (
          <div className="card" style={{ padding: "2.5rem", textAlign: "center", color: "hsl(215, 25%, 45%)" }}>
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
                <div key={record.id} className="card animate-slide-in" style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "1.5rem" }}>{getVehicleIcon(v.tipo)}</span>
                  <div style={{ flex: 1, minWidth: "140px" }}>
                    <p style={{ fontWeight: 800, fontSize: "1.0625rem", color: "hsl(210, 40%, 98%)", letterSpacing: "0.05em" }}>{v.placa}</p>
                    <p style={{ color: "hsl(215, 25%, 55%)", fontSize: "0.75rem", textTransform: "capitalize" }}>{v.tipo} {v.brand ? `· ${v.brand}` : ""}</p>
                  </div>
                  {apt && (
                    <div style={{ fontSize: "0.8125rem" }}>
                      <p style={{ color: "hsl(215, 25%, 70%)" }}>{apt.block?.name} · Apto {apt.number}</p>
                      {v.ownerName && <p style={{ color: "hsl(215, 25%, 50%)" }}>{v.ownerName}</p>}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "hsl(142, 71%, 55%)", fontSize: "0.8125rem", flexShrink: 0 }}>
                    <Clock size={13} /> <span>{formatDate(record.entryTime)}</span>
                  </div>
                  <span className="badge badge-success animate-pulse-glow">
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor", display: "inline-block" }} /> Adentro
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
