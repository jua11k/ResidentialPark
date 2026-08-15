"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Upload,
  Edit2,
  Trash2,
  Car,
  Building2,
  Phone,
  Mail,
  Filter,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { createVehicleAction, updateVehicleAction, deleteVehicleAction } from "@/actions/vehicle-actions";
import { getVehicleIcon } from "@/lib/utils";
import ImportXlsxModal from "./ImportXlsxModal";
import VehicleFormModal from "./VehicleFormModal";

interface VehiclesClientProps {
  tenantId: string;
  complexId: string;
  complexName: string;
  initialVehicles: any[];
  blocks: any[];
}

export default function VehiclesClient({
  tenantId,
  complexId,
  complexName,
  initialVehicles,
  blocks,
}: VehiclesClientProps) {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [search, setSearch] = useState("");
  const [filterBlock, setFilterBlock] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editVehicle, setEditVehicle] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ─── Filtros ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      const matchSearch =
        !search ||
        v.placa?.toLowerCase().includes(search.toLowerCase()) ||
        v.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
        v.apartment?.number?.toLowerCase().includes(search.toLowerCase());
      const matchBlock =
        !filterBlock || v.apartment?.block?.name === filterBlock;
      return matchSearch && matchBlock;
    });
  }, [vehicles, search, filterBlock]);

  // ─── Eliminar vehículo ─────────────────────────────────────────────────────
  async function handleDelete(vehicleId: string, placa: string) {
    if (!confirm(`¿Eliminar el vehículo con placa ${placa}? Esta acción no se puede deshacer.`)) return;
    setDeletingId(vehicleId);
    const result = await deleteVehicleAction(tenantId, vehicleId, "Eliminado por el operador");
    setDeletingId(null);
    if (result.success) {
      toast.success(`Vehículo ${placa} eliminado correctamente.`);
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    } else {
      toast.error(result.error ?? "Error al eliminar el vehículo.");
    }
  }

  const uniqueBlocks = [...new Set(vehicles.map((v) => v.apartment?.block?.name).filter(Boolean))];

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(210, 40%, 98%)", letterSpacing: "-0.02em" }}>
            🚗 Vehículos
          </h1>
          <p style={{ color: "hsl(215, 25%, 55%)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {complexName} · {vehicles.length} vehículo{vehicles.length !== 1 ? "s" : ""} registrado{vehicles.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={() => setShowImport(true)} className="btn-secondary">
            <Upload size={16} />
            Importar XLSX
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} />
            Nuevo Vehículo
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
          <Search size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "hsl(215, 25%, 55%)", pointerEvents: "none" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por placa, propietario o apto..."
            className="input"
            style={{ paddingLeft: "2.5rem" }}
          />
        </div>
        <select
          value={filterBlock}
          onChange={(e) => setFilterBlock(e.target.value)}
          className="input select"
          style={{ width: "auto", minWidth: "150px" }}
        >
          <option value="">Todos los bloques</option>
          {uniqueBlocks.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        {(search || filterBlock) && (
          <button onClick={() => { setSearch(""); setFilterBlock(""); }} className="btn-secondary">
            <X size={14} /> Limpiar
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
        {[
          { label: "Total", value: vehicles.length, icon: "🚗" },
          { label: "Carros", value: vehicles.filter((v) => v.tipo === "carro").length, icon: "🚗" },
          { label: "Motos", value: vehicles.filter((v) => v.tipo === "moto").length, icon: "🏍️" },
          { label: "Camionetas", value: vehicles.filter((v) => v.tipo === "camioneta").length, icon: "🚙" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: "1rem", textAlign: "center" }}>
            <p style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{s.icon}</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(210, 40%, 98%)" }}>{s.value}</p>
            <p style={{ fontSize: "0.75rem", color: "hsl(215, 25%, 55%)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center", color: "hsl(215, 25%, 45%)" }}>
          <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.75rem" }}>🔍</span>
          <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Sin resultados</p>
          <p style={{ fontSize: "0.8125rem" }}>
            {vehicles.length === 0
              ? "No hay vehículos registrados. Use el botón \"Nuevo Vehículo\" o importe un archivo XLSX."
              : "Intente con otros filtros."}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Vehículo</th>
                <th>Propietario</th>
                <th>Ubicación</th>
                <th>Contacto</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="animate-fade-in">
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "1.375rem" }}>{getVehicleIcon(v.tipo)}</span>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: "0.9375rem", letterSpacing: "0.05em", color: "hsl(210, 40%, 98%)" }}>
                          {v.placa}
                        </p>
                        <p style={{ color: "hsl(215, 25%, 55%)", fontSize: "0.75rem", textTransform: "capitalize" }}>
                          {v.tipo} {v.brand ? `· ${v.brand}` : ""} {v.color ? `· ${v.color}` : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "hsl(215, 25%, 70%)" }}>
                    {v.ownerName || <span style={{ color: "hsl(215, 25%, 35%)" }}>—</span>}
                  </td>
                  <td>
                    {v.apartment ? (
                      <div style={{ fontSize: "0.8125rem" }}>
                        <p style={{ color: "hsl(215, 25%, 70%)" }}>{v.apartment.block?.name}</p>
                        <p style={{ color: "hsl(215, 25%, 50%)" }}>Apto. {v.apartment.number}</p>
                      </div>
                    ) : (
                      <span style={{ color: "hsl(215, 25%, 35%)" }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: "0.8125rem" }}>
                    {v.ownerPhone && (
                      <p style={{ color: "hsl(215, 25%, 60%)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <Phone size={12} /> {v.ownerPhone}
                      </p>
                    )}
                    {v.ownerEmail && (
                      <p style={{ color: "hsl(215, 25%, 60%)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <Mail size={12} /> {v.ownerEmail}
                      </p>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.375rem" }}>
                      <button
                        onClick={() => setEditVehicle(v)}
                        className="btn-secondary"
                        style={{ padding: "0 0.625rem", minHeight: "36px" }}
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(v.id, v.placa)}
                        disabled={deletingId === v.id}
                        className="btn-danger"
                        style={{ padding: "0 0.625rem", minHeight: "36px" }}
                        title="Eliminar"
                      >
                        {deletingId === v.id ? <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {(showCreate || editVehicle) && (
        <VehicleFormModal
          tenantId={tenantId}
          complexId={complexId}
          blocks={blocks}
          vehicle={editVehicle}
          onClose={() => { setShowCreate(false); setEditVehicle(null); }}
          onSuccess={(v) => {
            if (editVehicle) {
              setVehicles((prev) => prev.map((x) => x.id === v.id ? v : x));
              toast.success(`Vehículo ${v.placa} actualizado.`);
            } else {
              setVehicles((prev) => [v, ...prev]);
              toast.success(`Vehículo ${v.placa} registrado.`);
            }
            setShowCreate(false);
            setEditVehicle(null);
          }}
        />
      )}

      {showImport && (
        <ImportXlsxModal
          tenantId={tenantId}
          complexId={complexId}
          onClose={() => setShowImport(false)}
          onSuccess={(count) => {
            toast.success(`${count} vehículo(s) importados correctamente.`);
            setShowImport(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
