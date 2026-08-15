"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerTenantAction, loginAction } from "@/actions/auth-actions";
import { toast } from "sonner";
import { Building2, User, Mail, Lock, Loader2, ArrowRight } from "lucide-react";

export default function RegisterTenantForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Auto-generate slug from name
  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    const slugInput = document.getElementById("tenantSlug") as HTMLInputElement;
    if (slugInput && !slugInput.dataset.manual) {
      slugInput.value = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
        .trim()
        .replace(/\s+/g, "-");
    }
  }

  async function handleRegister(formData: FormData) {
    setIsPending(true);
    setErrors({});
    
    const rawData = {
      tenantName: formData.get("tenantName"),
      tenantSlug: formData.get("tenantSlug"),
      adminName: formData.get("adminName"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const result = await registerTenantAction(rawData);
      
      if (result.success && result.data) {
        toast.success("¡Conjunto registrado con éxito! Iniciando sesión...");
        
        // Auto-login after registration
        const loginResult = await loginAction({
            email: rawData.email,
            password: rawData.password
        });

        if (loginResult.success && loginResult.data) {
            router.push(`/${loginResult.data.tenantSlug}/porteria`);
        } else {
            router.push('/login');
        }

      } else {
        if (result.validationErrors) {
          const errs: Record<string, string> = {};
          for (const [k, v] of Object.entries(result.validationErrors)) {
            errs[k] = (v as string[])[0];
          }
          setErrors(errs);
        }
        if (result.error && !result.validationErrors) {
          setErrors({ _general: result.error });
          toast.error(result.error);
        }
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="card" style={{ padding: "2.5rem", position: "relative", zIndex: 10, width: "100%", maxWidth: "480px" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(210, 40%, 98%)", marginBottom: "0.5rem" }}>
        Comienza gratis
      </h2>
      <p style={{ color: "hsl(215, 25%, 65%)", fontSize: "0.95rem", marginBottom: "2rem" }}>
        Registra tu conjunto residencial y moderniza tu control de acceso en minutos.
      </p>

      {errors._general && (
        <div style={{ background: "hsl(0, 60%, 8%)", border: "1px solid hsl(0, 72%, 25%)", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1rem", color: "hsl(0, 72%, 65%)", fontSize: "0.875rem" }}>
          {errors._general}
        </div>
      )}

      <form noValidate onSubmit={(e) => { e.preventDefault(); handleRegister(new FormData(e.currentTarget)); }} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        
        {/* Nombre del Conjunto */}
        <div>
          <label htmlFor="tenantName" className="input-label">Nombre del Conjunto *</label>
          <div style={{ position: "relative" }}>
            <Building2 size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "hsl(215, 25%, 55%)", pointerEvents: "none" }} />
            <input 
              id="tenantName" name="tenantName" type="text" placeholder="Ej: Torres de Alcalá" 
              className={`input ${errors.tenantName ? "error" : ""}`} style={{ paddingLeft: "2.75rem" }} 
              onChange={handleNameChange} required 
            />
          </div>
          {errors.tenantName && <p className="input-error">{errors.tenantName}</p>}
        </div>

        {/* Slug (URL) */}
        <div>
          <label htmlFor="tenantSlug" className="input-label">URL Personalizada (Slug) *</label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <span style={{ position: "absolute", left: "1rem", color: "hsl(215, 25%, 55%)", fontSize: "0.9rem", pointerEvents: "none" }}>
              app.com/
            </span>
            <input 
              id="tenantSlug" name="tenantSlug" type="text" placeholder="torres-de-alcala" 
              className={`input ${errors.tenantSlug ? "error" : ""}`} 
              style={{ paddingLeft: "5rem" }} 
              onChange={(e) => { e.target.dataset.manual = "true"; }} required 
            />
          </div>
          {errors.tenantSlug && <p className="input-error">{errors.tenantSlug}</p>}
        </div>

        <hr style={{ border: "none", borderTop: "1px solid hsl(220, 40%, 15%)", margin: "0.5rem 0" }} />

        {/* Administrador */}
        <div>
          <label htmlFor="adminName" className="input-label">Tu Nombre *</label>
          <div style={{ position: "relative" }}>
            <User size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "hsl(215, 25%, 55%)", pointerEvents: "none" }} />
            <input 
              id="adminName" name="adminName" type="text" placeholder="Juan Pérez" 
              className={`input ${errors.adminName ? "error" : ""}`} style={{ paddingLeft: "2.75rem" }} required 
            />
          </div>
          {errors.adminName && <p className="input-error">{errors.adminName}</p>}
        </div>

        {/* Correo Electrónico */}
        <div>
          <label htmlFor="email" className="input-label">Correo Electrónico *</label>
          <div style={{ position: "relative" }}>
            <Mail size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "hsl(215, 25%, 55%)", pointerEvents: "none" }} />
            <input 
              id="email" name="email" type="email" placeholder="admin@conjunto.com" 
              className={`input ${errors.email ? "error" : ""}`} style={{ paddingLeft: "2.75rem" }} required 
            />
          </div>
          {errors.email && <p className="input-error">{errors.email}</p>}
        </div>

        {/* Contraseña */}
        <div>
          <label htmlFor="password" className="input-label">Contraseña *</label>
          <div style={{ position: "relative" }}>
            <Lock size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "hsl(215, 25%, 55%)", pointerEvents: "none" }} />
            <input 
              id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" 
              className={`input ${errors.password ? "error" : ""}`} style={{ paddingLeft: "2.75rem" }} required 
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                    position: "absolute", right: "0.875rem", top: "50%",
                    transform: "translateY(-50%)", background: "none", border: "none",
                    color: "hsl(215, 25%, 55%)", cursor: "pointer", padding: "0.25rem",
                    fontSize: "0.8rem"
                }}
            >
                {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          {errors.password && <p className="input-error">{errors.password}</p>}
        </div>

        {/* Submit */}
        <button type="submit" className="btn-primary" disabled={isPending} style={{ marginTop: "1rem", width: "100%", height: "48px", fontSize: "1.05rem" }}>
          {isPending ? (
            <><Loader2 size={18} style={{ animation: "spin 0.7s linear infinite" }} /> Creando tu conjunto...</>
          ) : (
            <>Registrar Conjunto <ArrowRight size={18} /></>
          )}
        </button>
        
        <p style={{ textAlign: "center", color: "hsl(215, 25%, 55%)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
          ¿Ya tienes una cuenta? <a href="/login" style={{ color: "hsl(221, 83%, 65%)", textDecoration: "none", fontWeight: 600 }}>Inicia sesión aquí</a>
        </p>

      </form>
    </div>
  );
}
