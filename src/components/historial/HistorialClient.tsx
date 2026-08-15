"use client";

import { useState, useMemo } from "react";
import { Search, Clock, ArrowDownCircle, ArrowUpCircle, X } from "lucide-react";
import { formatDate, formatDuration, getVehicleIcon } from "@/lib/utils";

interface HistorialClientProps {
  records: any[];
  complexName: string;
}

export default function HistorialClient({ records, complexName }: HistorialClientProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        !search ||
        r.vehicle?.placa?.toLowerCase().includes(search.toLowerCase()) ||
        r.vehicle?.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
        r.vehicle?.apartment?.number?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || r.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [records, search, filterStatus]);

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(210, 40%, 98%)", letterSpacing: "-0.02em" }}>
          📋 Historial
        </h1>
        <p style={{ color: "hsl(215, 25%, 55%)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          {complexName} · {records.length} registro{records.length !== 1 ? "s" : ""} (últimos 100)
        </p>
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
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input select"
          style={{ width: "auto", minWidth: "140px" }}
        >
          <option value="">Todos los estados</option>
          <option value="inside">Adentro</option>
          <option value="completed">Completados</option>
          <option value="cancelled">Anulados</option>
        </select>
        {(search || filterStatus) && (
          <button onClick={() => { setSearch(""); setFilterStatus(""); }} className="btn-secondary">
            <X size={14} /> Limpiar
          </button>
        )}
      </div>

      {/* Stat pills */}
      <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
        <span className="badge badge-success">
          <ArrowDownCircle size={12} /> {records.filter((r) => r.status === "inside").length} adentro
        </span>
        <span className="badge badge-neutral">
          {records.filter((r) => r.status === "completed").length} completados
        </span>
      </div>

      {/* Records */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center", color: "hsl(215, 25%, 45%)" }}>
          <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.75rem" }}>📋</span>
          <p style={{ fontWeight: 600 }}>Sin registros</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Vehículo</th>
                <th>Propietario</th>
                <th>Ubicación</th>
                <th>Ingreso</th>
                <th>Salida</th>
                <th>Duración</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const v = r.vehicle;
                const apt = v?.apartment;
                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>{getVehicleIcon(v?.tipo)}</span>
                        <div>
                          <p style={{ fontWeight: 700, letterSpacing: "0.05em", color: "hsl(210, 40%, 98%)", fontSize: "0.875rem" }}>
                            {v?.placa}
                          </p>
                          <p style={{ fontSize: "0.6875rem", color: "hsl(215, 25%, 50%)", textTransform: "capitalize" }}>
                            {v?.tipo}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "hsl(215, 25%, 65%)", fontSize: "0.8125rem" }}>
                      {v?.ownerName || "—"}
                    </td>
                    <td style={{ fontSize: "0.8125rem" }}>
                      {apt ? (
                        <div>
                          <p style={{ color: "hsl(215, 25%, 70%)" }}>{apt.block?.name}</p>
                          <p style={{ color: "hsl(215, 25%, 50%)" }}>Apto. {apt.number}</p>
                        </div>
                      ) : "—"}
                    </td>
                    <td style={{ fontSize: "0.75rem", color: "hsl(215, 25%, 65%)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <ArrowDownCircle size={12} style={{ color: "hsl(142, 71%, 55%)" }} />
                        {formatDate(r.entryTime)}
                      </div>
                    </td>
                    <td style={{ fontSize: "0.75rem", color: "hsl(215, 25%, 65%)" }}>
                      {r.exitTime ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                          <ArrowUpCircle size={12} style={{ color: "hsl(0, 72%, 65%)" }} />
                          {formatDate(r.exitTime)}
                        </div>
                      ) : (
                        <span style={{ color: "hsl(215, 25%, 35%)" }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: "0.75rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "hsl(215, 25%, 60%)" }}>
                        <Clock size={11} />
                        {formatDuration(r.entryTime, r.exitTime)}
                      </div>
                    </td>
                    <td>
                      {r.status === "inside" && <span className="badge badge-success">Adentro</span>}
                      {r.status === "completed" && <span className="badge badge-neutral">Completado</span>}
                      {r.status === "cancelled" && <span className="badge badge-danger">Anulado</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
