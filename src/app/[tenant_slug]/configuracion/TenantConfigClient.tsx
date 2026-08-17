"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { updateTenantConfigAction, updateComplexParkingSpotsAction } from "@/actions/tenant-actions";
import { Save, Lock, Link as LinkIcon, Copy, ParkingCircle } from "lucide-react";

export default function TenantConfigClient({
  tenantId,
  complexId,
  tenantSlug,
  initialPublicPassword,
  initialCarSpots,
  initialMotoSpots,
  initialBikeSpots,
  initialLogoUrl,
}: {
  tenantId: string;
  complexId: string;
  tenantSlug: string;
  initialPublicPassword?: string;
  initialCarSpots?: number | null;
  initialMotoSpots?: number | null;
  initialBikeSpots?: number | null;
  initialLogoUrl?: string | null;
}) {
  const [password, setPassword] = useState(initialPublicPassword || "");
  const [saving, setSaving] = useState(false);
  const [savingSpots, setSavingSpots] = useState(false);
  const [carSpots, setCarSpots] = useState<string>(initialCarSpots?.toString() ?? "");
  const [motoSpots, setMotoSpots] = useState<string>(initialMotoSpots?.toString() ?? "");
  const [bikeSpots, setBikeSpots] = useState<string>(initialBikeSpots?.toString() ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl || null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const publicUrl = `${origin}/registro/${tenantSlug}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success("Enlace copiado al portapapeles");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await updateTenantConfigAction(tenantId, { publicRegistrationPassword: password });
      if (result.success) toast.success("Contraseña actualizada correctamente");
      else toast.error(result.error || "Error al actualizar");
    } catch {
      toast.error("Error inesperado al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSpots = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSpots(true);
    try {
      const result = await updateComplexParkingSpotsAction(tenantId, complexId, {
        carParkingSpots:  carSpots  !== "" ? parseInt(carSpots)  : null,
        motoParkingSpots: motoSpots !== "" ? parseInt(motoSpots) : null,
        bikeParkingSpots: bikeSpots !== "" ? parseInt(bikeSpots) : null,
      });
      if (result.success) toast.success("Cupos actualizados correctamente");
      else toast.error(result.error || "Error al actualizar los cupos");
    } catch {
      toast.error("Error inesperado al guardar los cupos");
    } finally {
      setSavingSpots(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* Tarjeta de Enlace Público */}
      <div style={{
        background: "hsl(223, 47%, 10%)",
        border: "1px solid hsl(220, 20%, 22%)",
        borderRadius: "1rem",
        padding: "1.5rem",
      }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.125rem", fontWeight: 600, color: "white", marginBottom: "1rem" }}>
          <LinkIcon size={18} style={{ color: "hsl(221, 83%, 65%)" }} />
          Enlace de Registro Público
        </h2>
        <p style={{ fontSize: "0.875rem", color: "hsl(215, 25%, 65%)", marginBottom: "1rem" }}>
          Comparte este enlace con los residentes para que puedan registrar sus vehículos de forma autónoma.
        </p>
        
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "hsl(220, 35%, 12%)", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid hsl(220, 20%, 25%)" }}>
          <code style={{ color: "hsl(221, 83%, 75%)", fontSize: "0.875rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {publicUrl}
          </code>
          <button 
            type="button" 
            onClick={copyToClipboard}
            className="btn-secondary" 
            style={{ padding: "0.5rem", minHeight: "auto", flexShrink: 0 }}
            title="Copiar enlace"
          >
            <Copy size={16} />
          </button>
        </div>
      </div>

      {/* Identidad Visual (Logo) */}
      <div style={{
        background: "hsl(223, 47%, 10%)",
        border: "1px solid hsl(220, 20%, 22%)",
        borderRadius: "1rem",
        padding: "1.5rem",
      }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.125rem", fontWeight: 600, color: "white", marginBottom: "0.5rem" }}>
          <span style={{ color: "hsl(221, 83%, 65%)" }}>🖼️</span>
          Identidad Visual
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "hsl(215, 25%, 55%)", marginBottom: "1.25rem" }}>
          Sube el logo de tu conjunto residencial para que los propietarios lo vean en la página de registro público.
        </p>

        <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ 
            width: "120px", 
            height: "120px", 
            borderRadius: "0.5rem", 
            border: "1px dashed hsl(215, 25%, 35%)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            background: "hsl(220, 35%, 11%)",
            overflow: "hidden",
            flexShrink: 0
          }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo Conjunto" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <span style={{ color: "hsl(215, 25%, 45%)", fontSize: "0.75rem", textAlign: "center" }}>Sin logo</span>
            )}
          </div>
          
          <div style={{ flex: 1, minWidth: "200px" }}>
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <label className="btn-secondary" style={{ cursor: uploadingLogo ? "not-allowed" : "pointer", opacity: uploadingLogo ? 0.7 : 1 }}>
                {uploadingLogo ? "Subiendo..." : "Seleccionar Archivo"}
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/jpg, image/webp" 
                  style={{ display: "none" }} 
                  disabled={uploadingLogo}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error("La imagen debe ser menor a 5MB.");
                      return;
                    }
                    setUploadingLogo(true);
                    try {
                      const { uploadTenantLogoAction } = await import("@/actions/tenant-actions");
                      const fd = new FormData();
                      fd.append("logo", file);
                      const res = await uploadTenantLogoAction(tenantId, fd);
                      if (res.success && res.data?.logoUrl) {
                        setLogoUrl(res.data.logoUrl);
                        toast.success("Logo subido correctamente");
                      } else {
                        toast.error(res.error || "Error al subir imagen");
                      }
                    } catch {
                      toast.error("Error al procesar la imagen");
                    } finally {
                      setUploadingLogo(false);
                      e.target.value = ""; // reset
                    }
                  }}
                />
              </label>
              {logoUrl && (
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ color: "hsl(0, 72%, 65%)", borderColor: "hsl(0, 72%, 35%)", background: "hsl(0, 72%, 10%)" }}
                  disabled={uploadingLogo}
                  onClick={async () => {
                    if(!confirm("¿Estás seguro de eliminar el logo?")) return;
                    setUploadingLogo(true);
                    try {
                      const { deleteTenantLogoAction } = await import("@/actions/tenant-actions");
                      const res = await deleteTenantLogoAction(tenantId);
                      if(res.success) {
                        setLogoUrl(null);
                        toast.success("Logo eliminado");
                      } else {
                        toast.error(res.error || "Error al eliminar");
                      }
                    } catch {
                      toast.error("Error al eliminar");
                    } finally {
                      setUploadingLogo(false);
                    }
                  }}
                >
                  Eliminar
                </button>
              )}
            </div>
            <p style={{ fontSize: "0.75rem", color: "hsl(215, 25%, 55%)" }}>
              Formatos soportados: JPG, PNG, WEBP. Tamaño máximo: 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Tarjeta de Parqueaderos */}
      <div style={{
        background: "hsl(223, 47%, 10%)",
        border: "1px solid hsl(220, 20%, 22%)",
        borderRadius: "1rem",
        padding: "1.5rem",
      }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.125rem", fontWeight: 600, color: "white", marginBottom: "1rem" }}>
          <ParkingCircle size={18} style={{ color: "hsl(221, 83%, 65%)" }} />
          Capacidad de Parqueaderos
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "hsl(215, 25%, 55%)", marginBottom: "1.25rem" }}>
          Deja el campo en blanco si los cupos de ese tipo son iguales al número de apartamentos del conjunto (valor predeterminado). Solo ingresa un número si la capacidad es diferente.
        </p>
        <form onSubmit={handleSaveSpots}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "hsl(215, 25%, 75%)", marginBottom: "0.4rem" }}>Carros / Camionetas</label>
              <input
                type="number"
                min="0"
                value={carSpots}
                onChange={(e) => setCarSpots(e.target.value)}
                placeholder="Sin límite"
                className="input-base"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "hsl(215, 25%, 75%)", marginBottom: "0.4rem" }}>Motos</label>
              <input
                type="number"
                min="0"
                value={motoSpots}
                onChange={(e) => setMotoSpots(e.target.value)}
                placeholder="Sin límite"
                className="input-base"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "hsl(215, 25%, 75%)", marginBottom: "0.4rem" }}>Bicicletas</label>
              <input
                type="number"
                min="0"
                value={bikeSpots}
                onChange={(e) => setBikeSpots(e.target.value)}
                placeholder="Sin límite"
                className="input-base"
                style={{ width: "100%" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={savingSpots} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Save size={16} />
              {savingSpots ? "Guardando..." : "Guardar Cupos"}
            </button>
          </div>
        </form>
      </div>

      {/* Tarjeta de Seguridad */}
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
    </div>
  );
}
