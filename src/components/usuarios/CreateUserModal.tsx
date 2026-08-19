"use client";

import { useState } from "react";
import { createAdminUserAction } from "@/actions/user-actions";
import { toast } from "sonner";
import { X, Loader2, UserPlus, Copy, CheckCircle2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string;
}

export default function CreateUserModal({ isOpen, onClose, onSuccess, tenantId }: Props) {
  const [isPending, setIsPending] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  async function handleCreate(formData: FormData) {
    setIsPending(true);
    try {
      const data = {
        tenantId,
        name: formData.get("name"),
        username: formData.get("username"),
      };

      const result = await createAdminUserAction(data);
      if (result.success && result.data) {
        setTempPassword(result.data.tempPassword);
        onSuccess();
      } else {
        if (result.validationErrors) {
          const errors = Object.values(result.validationErrors).flat();
          toast.error(errors[0] || "Datos inválidos");
        } else {
          toast.error(result.error || "Error al crear usuario");
        }
      }
    } finally {
      setIsPending(false);
    }
  }

  function handleCopy() {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Contraseña copiada");
    }
  }

  function handleClose() {
    setTempPassword(null);
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-content animate-slide-up" style={{ maxWidth: "450px" }}>
        
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ padding: "0.5rem", background: "hsl(221, 83%, 15%)", borderRadius: "0.5rem", color: "hsl(221, 83%, 65%)" }}>
              <UserPlus size={20} />
            </div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "hsl(210, 40%, 98%)" }}>
              Nuevo Guardia
            </h2>
          </div>
          <button onClick={handleClose} className="btn-secondary" style={{ padding: "0.4rem", border: "none" }} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {tempPassword ? (
          <div className="modal-body" style={{ textAlign: "center", padding: "2rem 1rem" }}>
            <div style={{ display: "inline-flex", background: "hsl(142, 70%, 15%)", color: "hsl(142, 70%, 50%)", padding: "1rem", borderRadius: "50%", marginBottom: "1.5rem" }}>
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "white", marginBottom: "0.5rem" }}>
              ¡Usuario Creado!
            </h3>
            <p style={{ color: "hsl(215, 25%, 65%)", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
              Copia esta contraseña y entrégala al guardia. <strong>No se volverá a mostrar.</strong>
            </p>
            
            <div style={{ 
              background: "hsl(224, 71%, 10%)", 
              border: "1px solid hsl(220, 20%, 25%)", 
              padding: "1rem", 
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.5rem"
            }}>
              <span style={{ fontFamily: "monospace", fontSize: "1.25rem", color: "hsl(221, 83%, 75%)", letterSpacing: "2px" }}>
                {tempPassword}
              </span>
              <button onClick={handleCopy} className="btn-secondary" style={{ padding: "0.5rem" }}>
                {copied ? <CheckCircle2 size={16} color="hsl(142, 70%, 50%)" /> : <Copy size={16} />}
              </button>
            </div>

            <button onClick={handleClose} className="btn-primary" style={{ width: "100%" }}>
              Aceptar y Cerrar
            </button>
          </div>
        ) : (
          <form action={handleCreate}>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label htmlFor="name" className="input-label">Nombre Completo</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="input"
                  placeholder="Ej: Juan Pérez"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="username" className="input-label">Nombre de Usuario (Login)</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  className="input"
                  placeholder="Ej: guarda01"
                  pattern="[a-zA-Z0-9_]+"
                  title="Solo letras, números y guiones bajos"
                  required
                />
                <p style={{ fontSize: "0.75rem", color: "hsl(215, 25%, 55%)", marginTop: "0.375rem" }}>
                  El guardia usará este nombre para iniciar sesión.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={handleClose} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={isPending}>
                {isPending ? <><Loader2 size={16} className="animate-spin" /> Creando...</> : "Crear Usuario"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
