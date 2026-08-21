"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createApartmentAction, updateApartmentAction } from "@/actions/apartment-actions";

export default function ApartmentModal({
  tenantId,
  complexId,
  blockId,
  apartment,
  onClose,
  onSuccess,
}: {
  tenantId: string;
  complexId: string;
  blockId: string;
  apartment?: { id: string; number: string; floor?: number | null } | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [number, setNumber] = useState(apartment?.number || "");
  const [floor, setFloor] = useState<string>(apartment?.floor ? String(apartment.floor) : "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim()) return;

    setIsSubmitting(true);
    try {
      let res;
      const data = { 
        number: number.trim(),
        floor: floor ? parseInt(floor) : null
      };

      if (apartment) {
        res = await updateApartmentAction(tenantId, apartment.id, data);
      } else {
        res = await createApartmentAction(tenantId, complexId, blockId, data);
      }

      if (res.success) {
        toast.success(apartment ? "Apartamento actualizado" : "Apartamento creado");
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
          {apartment ? "Editar Apartamento" : "Añadir Apartamento"}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label className="input-label">Número de Apartamento *</label>
            <input
              type="text"
              className="input"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Ej. 101 A"
              required
            />
          </div>
          <div>
            <label className="input-label">Piso (Opcional)</label>
            <input
              type="number"
              className="input"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="Ej. 1"
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting || !number.trim()}>
              {isSubmitting ? "Procesando..." : apartment ? "Guardar Cambios" : "Crear Apartamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
