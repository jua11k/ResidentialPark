"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/actions/auth-actions";
import { toast } from "sonner";
import { Building2, Lock, Mail, Eye, EyeOff, Loader2, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reason") === "session_expired") {
      toast.error("Tu sesión fue cerrada porque se inició sesión en otro dispositivo.");
      router.replace("/login");
    }
  }, [router]);

  async function handleLogin(formData: FormData) {
    setIsPending(true);
    const rawData = {
      usernameOrEmail: formData.get("usernameOrEmail"),
      password: formData.get("password"),
    };

    try {
      const result = await loginAction(rawData);
      if (result.success && result.data) {
        toast.success("¡Bienvenido! Accediendo al sistema...");
        setTimeout(() => {
          router.push(`/${result.data.tenantSlug}/porteria`);
        }, 500);
      } else {
        toast.error(result.error ?? "Error al iniciar sesión.");
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ background: "hsl(224, 71%, 4%)" }}>
      {/* Background glow */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 0%, hsl(221, 83%, 15%) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="w-full animate-fade-in"
        style={{ maxWidth: "420px", position: "relative", zIndex: 1 }}
      >
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "72px",
              height: "72px",
              borderRadius: "1.25rem",
              background: "linear-gradient(135deg, hsl(221, 83%, 53%), hsl(221, 83%, 35%))",
              boxShadow: "0 0 40px hsl(221, 83%, 40%, 0.5)",
              marginBottom: "1.25rem",
            }}
          >
            <Building2 size={36} color="white" />
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "hsl(210, 40%, 98%)",
              letterSpacing: "-0.025em",
              marginBottom: "0.5rem",
            }}
          >
            ResidentialPark
          </h1>
          <p style={{ color: "hsl(215, 25%, 55%)", fontSize: "0.9rem" }}>
            Gestión de parqueaderos residenciales
          </p>
        </div>

        {/* Card */}
        <div
          className="card"
          style={{ padding: "2rem" }}
        >
          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "hsl(210, 40%, 98%)",
              marginBottom: "1.5rem",
            }}
          >
            Iniciar Sesión
          </h2>

          <form noValidate onSubmit={(e) => { e.preventDefault(); handleLogin(new FormData(e.currentTarget)); }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* Username or Email */}
              <div>
                <label htmlFor="usernameOrEmail" className="input-label">
                  Usuario o Correo electrónico
                </label>
                <div style={{ position: "relative" }}>
                  <User
                    size={16}
                    style={{
                      position: "absolute", left: "0.875rem", top: "50%",
                      transform: "translateY(-50%)", color: "hsl(215, 25%, 55%)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    id="usernameOrEmail"
                    name="usernameOrEmail"
                    type="text"
                    placeholder="guarda01 / admin@conjunto.com"
                    className="input"
                    style={{ paddingLeft: "2.5rem" }}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="input-label">
                  Contraseña
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={16}
                    style={{
                      position: "absolute", left: "0.875rem", top: "50%",
                      transform: "translateY(-50%)", color: "hsl(215, 25%, 55%)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="input"
                    style={{ paddingLeft: "2.5rem", paddingRight: "2.75rem" }}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute", right: "0.875rem", top: "50%",
                      transform: "translateY(-50%)", background: "none", border: "none",
                      color: "hsl(215, 25%, 55%)", cursor: "pointer", padding: "0.25rem",
                    }}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => router.push("/login/recovery")}
                    style={{
                      background: "none", border: "none", color: "hsl(221, 83%, 53%)",
                      fontSize: "0.85rem", cursor: "pointer", padding: 0, textDecoration: "underline"
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn-primary"
                disabled={isPending}
                style={{ marginTop: "0.5rem", width: "100%" }}
              >
                {isPending ? (
                  <>
                    <Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} />
                    Ingresando...
                  </>
                ) : (
                  "Ingresar al sistema"
                )}
              </button>
            </div>
          </form>
        </div>

        <p style={{ textAlign: "center", color: "hsl(215, 25%, 40%)", fontSize: "0.75rem", marginTop: "1.5rem" }}>
          © {new Date().getFullYear()} ResidentialPark · Sistema de Control de Acceso
        </p>
      </div>
    </main>
  );
}
