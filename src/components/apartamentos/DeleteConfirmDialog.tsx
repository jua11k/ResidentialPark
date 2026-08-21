"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteBlockAction, deleteApartmentAction } from "@/actions/apartment-actions";

export default function DeleteConfirmDialog({
  tenantId,
  item,
  type,
  onClose,
  onSuccess,
}: {
  tenantId: string;
  item: { id: string; name?: string; number?: string };
  type: "block" | "apartment";
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      let res;
      if (type === "block") {
        res = await deleteBlockAction(tenantId, item.id);
      } else {
        res = await deleteApartmentAction(tenantId, item.id);
      }

      if (res.success) {
        toast.success(type === "block" ? "Torre eliminada" : "Apartamento eliminado");
        onSuccess();
      } else {
        toast.error(res.error || "Error al eliminar");
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado.");
    } finally {
      setIsDeleting(false);
    }
  };

  const displayName = type === "block" ? item.name : item.number;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div className="card" style={{ padding: "2rem", width: "100%", maxWidth: "400px", position: "relative", zIndex: 101, background: "hsl(223, 47%, 10%)" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "white", marginBottom: "1rem" }}>
          Confirmar Eliminación
        </h2>
        <p style={{ color: "hsl(215, 25%, 65%)", marginBottom: "1.5rem" }}>
          ¿Estás seguro de que deseas eliminar {type === "block" ? "la torre" : "el apartamento"} <strong>{displayName}</strong>? 
          Esta acción realizará un borrado lógico para mantener el historial.
        </p>
        
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <button type="button" onClick={onClose} className="btn-secondary" disabled={isDeleting}>
            Cancelar
          </button>
          <button 
            type="button" 
            onClick={handleDelete}
            className="btn-primary" 
            style={{ background: "hsl(0, 72%, 45%)", border: "none" }}
            disabled={isDeleting}
          >
            {isDeleting ? "Eliminando..." : "Sí, Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
