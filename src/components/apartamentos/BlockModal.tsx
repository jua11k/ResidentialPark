"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createBlockAction, updateBlockAction } from "@/actions/apartment-actions";

export default function BlockModal({
  tenantId,
  complexId,
  block,
  onClose,
  onSuccess,
}: {
  tenantId: string;
  complexId: string;
  block?: { id: string; name: string } | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(block?.name || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      let res;
      if (block) {
        res = await updateBlockAction(tenantId, block.id, { name: name.trim() });
      } else {
        res = await createBlockAction(tenantId, complexId, { 
          name: name.trim(),
          tenantId,
          complexId,
        });
      }

      if (res.success) {
        toast.success(block ? "Torre actualizada" : "Torre creada");
        onSuccess();
      } else {
        toast.error(res.error || "Error al procesar la solicitud");
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div className="card" style={{ padding: "2rem", width: "100%", maxWidth: "400px", position: "relative", zIndex: 101, background: "hsl(223, 47%, 10%)" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "white", marginBottom: "1.5rem" }}>
          {block ? "Editar Torre" : "Añadir Torre Manualmente"}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label className="input-label">Nombre de la Torre/Bloque</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Torre A, Bloque 1"
              required
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? "Procesando..." : block ? "Guardar Cambios" : "Crear Torre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
