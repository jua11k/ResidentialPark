"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestPasswordReset, resetPasswordWithCode } from "@/actions/auth-actions";
import { toast } from "sonner";
import { Building2, ArrowLeft, Loader2, Mail, KeyRound, Lock, EyeOff, Eye } from "lucide-react";

export default function RecoveryPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleRequestCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;

    setIsPending(true);
    try {
      const result = await requestPasswordReset(email);
      if (result.success) {
        toast.success("Si tu correo está registrado como administrador, recibirás un código de recuperación en breve.");
        setStep("verify");
      } else {
        toast.error(result.error || "Ocurrió un error.");
      }
    } finally {
      setIsPending(false);
    }
  }

  async function handleVerifyAndReset(formData: FormData) {
    setIsPending(true);
    const code = formData.get("code") as string;
    const newPassword = formData.get("newPassword") as string;

    try {
      const result = await resetPasswordWithCode(email, code, newPassword);
      if (result.success) {
        toast.success("Contraseña actualizada exitosamente.");
        router.push("/login");
      } else {
        toast.error(result.error || "Error al actualizar la contraseña.");
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
        <button
          onClick={() => router.push("/login")}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: "none", border: "none", color: "hsl(215, 25%, 55%)",
            cursor: "pointer", marginBottom: "1.5rem", fontSize: "0.9rem"
          }}
        >
          <ArrowLeft size={16} /> Volver al inicio de sesión
        </button>

        <div className="card" style={{ padding: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "hsl(210, 40%, 98%)", marginBottom: "0.5rem" }}>
            Recuperar Contraseña
          </h2>
          <p style={{ color: "hsl(215, 25%, 55%)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            {step === "request" 
              ? "Ingresa tu correo de administrador para recibir un código de recuperación."
              : "Ingresa el código que enviamos a tu correo y tu nueva contraseña."}
          </p>

          {step === "request" && (
            <form onSubmit={handleRequestCode}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label htmlFor="email" className="input-label">Correo electrónico</label>
                  <div style={{ position: "relative" }}>
                    <Mail size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "hsl(215, 25%, 55%)", pointerEvents: "none" }} />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@conjunto.com"
                      className="input"
                      style={{ paddingLeft: "2.5rem" }}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={isPending} style={{ width: "100%", marginTop: "0.5rem" }}>
                  {isPending ? <><Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} /> Solicitando...</> : "Enviar código"}
                </button>
              </div>
            </form>
          )}

          {step === "verify" && (
            <form action={handleVerifyAndReset}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label htmlFor="code" className="input-label">Código de verificación (6 dígitos)</label>
                  <div style={{ position: "relative" }}>
                    <KeyRound size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "hsl(215, 25%, 55%)", pointerEvents: "none" }} />
                    <input
                      id="code"
                      name="code"
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      className="input"
                      style={{ paddingLeft: "2.5rem", letterSpacing: "2px", fontFamily: "monospace" }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword" className="input-label">Nueva Contraseña</label>
                  <div style={{ position: "relative" }}>
                    <Lock size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "hsl(215, 25%, 55%)", pointerEvents: "none" }} />
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="input"
                      style={{ paddingLeft: "2.5rem", paddingRight: "2.75rem" }}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", color: "hsl(215, 25%, 55%)", cursor: "pointer", padding: "0.25rem"
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={isPending} style={{ width: "100%", marginTop: "0.5rem" }}>
                  {isPending ? <><Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} /> Actualizando...</> : "Guardar contraseña"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
