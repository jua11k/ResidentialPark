"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateTenantConfigAction } from "@/actions/tenant-actions";
import { Save, Lock } from "lucide-react";

export default function TenantConfigClient({
  tenantId,
  initialPublicPassword,
}: {
  tenantId: string;
  initialPublicPassword?: string;
}) {
  const [password, setPassword] = useState(initialPublicPassword || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const result = await updateTenantConfigAction(tenantId, {
        publicRegistrationPassword: password,
      });

      if (result.success) {
        toast.success("Configuración actualizada correctamente");
      } else {
        toast.error(result.error || "Error al actualizar");
      }
    } catch (error) {
      toast.error("Error inesperado al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      background: "hsl(223, 47%, 10%)",
      border: "1px solid hsl(220, 20%, 22%)",
      borderRadius: "1rem",
      padding: "1.5rem",
    }}>
      <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.125rem", fontWeight: 600, color: "white", marginBottom: "1.5rem" }}>
        <Lock size={18} style={{ color: "hsl(221, 83%, 65%)" }} />
        Seguridad
      </h2>

      <form onSubmit={handleSave}>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "hsl(215, 25%, 75%)", marginBottom: "0.5rem" }}>
            Contraseña de Registro Público
          </label>
          <p style={{ fontSize: "0.8125rem", color: "hsl(215, 25%, 55%)", marginBottom: "0.75rem" }}>
            Esta contraseña será requerida a los residentes cuando intenten registrar sus vehículos a través del enlace público, evitando así que personas externas ingresen datos errados.
          </p>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ej. MiConjunto2026"
            className="input-base"
            style={{ width: "100%", maxWidth: "300px" }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Save size={16} />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
