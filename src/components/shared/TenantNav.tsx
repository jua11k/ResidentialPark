"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/actions/auth-actions";
import { toast } from "sonner";
import {
  Building2,
  Car,
  History,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Home,
  Users,
} from "lucide-react";

interface TenantNavProps {
  tenantName: string;
  tenantSlug: string;
  userRole: string;
  userName: string;
}

const navItems = (slug: string) => [
  { href: `/${slug}/porteria`, label: "Portería", icon: ShieldCheck },
  { href: `/${slug}/vehiculos`, label: "Vehículos", icon: Car },
  { href: `/${slug}/apartamentos`, label: "Apartamentos", icon: Home },
  { href: `/${slug}/historial`, label: "Historial", icon: History },
];

export default function TenantNav({ tenantName, tenantSlug, userRole, userName }: TenantNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logoutAction();
    toast.success("Sesión cerrada correctamente.");
    router.push("/login");
  }

  const items = navItems(tenantSlug);

  return (
    <>
      {/* Desktop Sidebar / Mobile Top Bar */}
      <nav
        style={{
          background: "hsl(223, 47%, 10%)",
          borderBottom: "1px solid hsl(220, 20%, 22%)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 1rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            height: "60px",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginRight: "0.5rem" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "0.5rem",
                background: "linear-gradient(135deg, hsl(221, 83%, 53%), hsl(221, 83%, 35%))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Building2 size={18} color="white" />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "hsl(210, 40%, 98%)", lineHeight: 1.2 }}>
                {tenantName}
              </span>
              <span style={{ fontSize: "0.6875rem", color: "hsl(215, 25%, 55%)", lineHeight: 1 }}>
                ResidentialPark
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flex: 1 }} className="desktop-nav">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 0.875rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                    background: isActive ? "hsl(221, 83%, 53%, 0.15)" : "transparent",
                    color: isActive ? "hsl(221, 83%, 75%)" : "hsl(215, 25%, 65%)",
                    borderBottom: isActive ? "2px solid hsl(221, 83%, 53%)" : "2px solid transparent",
                  }}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User + Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginLeft: "auto" }}>
            <div style={{ textAlign: "right", display: "flex", flexDirection: "column" }} className="desktop-nav">
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(210, 40%, 98%)" }}>
                {userName}
              </span>
              <span style={{ fontSize: "0.6875rem", color: "hsl(215, 25%, 55%)" }}>
                {userRole}
              </span>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn-secondary"
              style={{ padding: "0 0.75rem", minHeight: "36px" }}
              aria-label="Cerrar sesión"
            >
              <LogOut size={16} />
              <span className="desktop-nav">Salir</span>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="btn-secondary mobile-menu-btn"
              style={{ padding: "0 0.75rem", minHeight: "36px" }}
              aria-label="Menú"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileOpen && (
          <div
            className="mobile-menu"
            style={{
              borderTop: "1px solid hsl(220, 20%, 22%)",
              padding: "0.75rem 1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
          >
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.9375rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    background: isActive ? "hsl(221, 83%, 53%, 0.15)" : "transparent",
                    color: isActive ? "hsl(221, 83%, 75%)" : "hsl(215, 25%, 65%)",
                  }}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <style>{`
        .desktop-nav { display: flex; }
        .mobile-menu-btn { display: none; }
        .mobile-menu { display: none; }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .mobile-menu { display: flex !important; }
        }
      `}</style>
    </>
  );
}
