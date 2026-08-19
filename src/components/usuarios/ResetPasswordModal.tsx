"use client";

import { useState } from "react";
import { resetUserPasswordAction } from "@/actions/user-actions";
import { toast } from "sonner";
import { X, Loader2, KeyRound, Copy, CheckCircle2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export default function ResetPasswordModal({ isOpen, onClose, onSuccess, userId }: Props) {
  const [isPending, setIsPending] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  async function handleReset() {
    setIsPending(true);
    try {
      const result = await resetUserPasswordAction(userId);
      if (result.success && result.data) {
        setTempPassword(result.data.tempPassword);
        onSuccess();
      } else {
        toast.error(result.error || "Error al reiniciar contraseña");
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
            <div style={{ padding: "0.5rem", background: "hsl(35, 90%, 15%)", borderRadius: "0.5rem", color: "hsl(35, 90%, 60%)" }}>
              <KeyRound size={20} />
            </div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "hsl(210, 40%, 98%)" }}>
              Cambiar Contraseña
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
              Contraseña Generada
            </h3>
            <p style={{ color: "hsl(215, 25%, 65%)", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
              La contraseña ha sido cambiada. Copia esta nueva contraseña y entrégala al usuario. <strong>No se volverá a mostrar.</strong>
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
          <>
            <div className="modal-body" style={{ padding: "1.5rem 1.25rem" }}>
              <p style={{ color: "hsl(215, 25%, 65%)", fontSize: "0.9375rem", lineHeight: 1.5 }}>
                ¿Estás seguro que deseas reiniciar la contraseña de este usuario? 
                Se generará una nueva contraseña de forma aleatoria y <strong>el usuario será desconectado de todos sus dispositivos activos.</strong>
              </p>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={handleClose} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={handleReset} className="btn-primary" disabled={isPending}>
                {isPending ? <><Loader2 size={16} className="animate-spin" /> Procesando...</> : "Generar Contraseña"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
