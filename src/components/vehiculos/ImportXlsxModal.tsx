"use client";

import { useState, useRef } from "react";
import { X, Upload, Download, AlertCircle, CheckCircle2, Loader2, FileSpreadsheet } from "lucide-react";
import { importVehiclesAction } from "@/actions/import-actions";
import { parseXlsxFile, generateXlsxTemplate } from "@/lib/xlsx-parser";

interface ImportXlsxModalProps {
  tenantId: string;
  complexId: string;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export default function ImportXlsxModal({ tenantId, complexId, onClose, onSuccess }: ImportXlsxModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: any[] } | null>(null);
  const [parseError, setParseError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith(".xlsx") && !selected.name.endsWith(".xls")) {
      setParseError("Solo se aceptan archivos .xlsx o .xls");
      return;
    }

    setFile(selected);
    setParseError("");
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseXlsxFile(ev.target!.result as ArrayBuffer);
        setRows(parsed);
      } catch {
        setParseError("No se pudo leer el archivo. Verifique el formato.");
      }
    };
    reader.readAsArrayBuffer(selected);
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setImporting(true);
    const res = await importVehiclesAction(tenantId, complexId, file?.name ?? "import.xlsx", rows);
    setImporting(false);
    if (res.success) {
      setResult(res.data);
      if (res.data.success > 0 && res.data.errors.length === 0) {
        onSuccess(res.data.success);
      }
    } else {
      setParseError(res.error ?? "Error al importar.");
    }
  }

  function downloadTemplate() {
    const buffer = generateXlsxTemplate();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_vehiculos.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card animate-fade-in" style={{ width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto", padding: "1.5rem" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "0.5rem", background: "hsl(142, 60%, 10%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileSpreadsheet size={18} color="hsl(142, 71%, 55%)" />
            </div>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "1.0625rem", color: "hsl(210, 40%, 98%)" }}>Importar Vehículos</h2>
              <p style={{ fontSize: "0.75rem", color: "hsl(215, 25%, 55%)" }}>Archivo XLSX · Máx. 500 filas</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: "0 0.5rem", minHeight: "36px" }}>
            <X size={16} />
          </button>
        </div>

        {/* Formato esperado */}
        <div style={{ background: "hsl(220, 35%, 12%)", border: "1px solid hsl(220, 20%, 22%)", borderRadius: "0.5rem", padding: "0.875rem", marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.8125rem", color: "hsl(215, 25%, 65%)", marginBottom: "0.5rem", fontWeight: 600 }}>
            Formato de columnas esperado:
          </p>
          <p style={{ fontSize: "0.75rem", color: "hsl(215, 25%, 50%)", fontFamily: "monospace", lineHeight: 1.8 }}>
            Placa | Vehículo | Propietario | Apartamento | Bloque | Telefono contacto | Correo electrónico
          </p>
          <button onClick={downloadTemplate} className="btn-secondary" style={{ marginTop: "0.75rem", padding: "0 0.875rem", minHeight: "36px", fontSize: "0.8125rem" }}>
            <Download size={14} /> Descargar plantilla
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${file ? "hsl(142, 71%, 35%)" : "hsl(220, 20%, 28%)"}`,
            borderRadius: "0.75rem",
            padding: "2rem",
            textAlign: "center",
            cursor: "pointer",
            background: file ? "hsl(142, 60%, 5%)" : "hsl(220, 35%, 8%)",
            transition: "all 0.2s ease",
            marginBottom: "1rem",
          }}
        >
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} style={{ display: "none" }} />
          <Upload size={28} style={{ margin: "0 auto 0.75rem", color: file ? "hsl(142, 71%, 55%)" : "hsl(215, 25%, 45%)" }} />
          {file ? (
            <>
              <p style={{ fontWeight: 700, color: "hsl(142, 71%, 65%)" }}>{file.name}</p>
              <p style={{ fontSize: "0.8125rem", color: "hsl(215, 25%, 55%)", marginTop: "0.25rem" }}>
                {rows.length} fila{rows.length !== 1 ? "s" : ""} detectada{rows.length !== 1 ? "s" : ""}
              </p>
            </>
          ) : (
            <>
              <p style={{ fontWeight: 600, color: "hsl(215, 25%, 65%)" }}>Haga clic para seleccionar el archivo</p>
              <p style={{ fontSize: "0.8125rem", color: "hsl(215, 25%, 45%)", marginTop: "0.25rem" }}>
                .xlsx o .xls · máximo 500 registros
              </p>
            </>
          )}
        </div>

        {parseError && (
          <div style={{ background: "hsl(0, 60%, 8%)", border: "1px solid hsl(0, 72%, 25%)", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1rem", color: "hsl(0, 72%, 65%)", fontSize: "0.875rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <AlertCircle size={16} /> {parseError}
          </div>
        )}

        {/* Preview */}
        {rows.length > 0 && !result && (
          <div style={{ marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(215, 25%, 65%)", marginBottom: "0.5rem" }}>
              Vista previa (primeras 3 filas):
            </p>
            <div style={{ overflowX: "auto", borderRadius: "0.5rem", border: "1px solid hsl(220, 20%, 22%)" }}>
              <table style={{ fontSize: "0.75rem" }}>
                <thead>
                  <tr>
                    {["Placa", "Tipo", "Propietario", "Apto", "Bloque"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 3).map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, letterSpacing: "0.05em" }}>{r.placa}</td>
                      <td style={{ textTransform: "capitalize" }}>{r.tipo}</td>
                      <td>{r.propietario}</td>
                      <td>{r.apartamento}</td>
                      <td>{r.bloque}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ background: "hsl(142, 60%, 6%)", border: "1px solid hsl(142, 71%, 25%)", borderRadius: "0.5rem", padding: "1rem", marginBottom: "0.75rem" }}>
              <p style={{ color: "hsl(142, 71%, 65%)", fontWeight: 700, fontSize: "0.9rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <CheckCircle2 size={16} /> {result.success} vehículo{result.success !== 1 ? "s" : ""} importado{result.success !== 1 ? "s" : ""} correctamente
              </p>
            </div>
            {result.errors.length > 0 && (
              <div style={{ background: "hsl(38, 80%, 5%)", border: "1px solid hsl(38, 92%, 20%)", borderRadius: "0.5rem", padding: "1rem" }}>
                <p style={{ color: "hsl(38, 92%, 65%)", fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  ⚠️ {result.errors.length} error{result.errors.length !== 1 ? "es" : ""}:
                </p>
                <div style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {result.errors.map((err, i) => (
                    <p key={i} style={{ fontSize: "0.75rem", color: "hsl(38, 92%, 55%)" }}>
                      Fila {err.row} · {err.placa} → {err.reason}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
            {result ? "Cerrar" : "Cancelar"}
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={rows.length === 0 || importing}
              className="btn-primary"
              style={{ flex: 1 }}
            >
              {importing ? (
                <><Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} /> Importando...</>
              ) : (
                <><Upload size={16} /> Importar {rows.length > 0 ? `${rows.length} registros` : ""}</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
