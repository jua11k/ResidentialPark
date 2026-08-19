"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { UserPlus, Shield, KeyRound, Trash2, ShieldCheck, Mail, User } from "lucide-react";
import CreateUserModal from "./CreateUserModal";
import ResetPasswordModal from "./ResetPasswordModal";
import { deleteUserAction, listTenantUsersAction } from "@/actions/user-actions";
import { toast } from "sonner";

interface UserItem {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  role: string;
  status: string;
  lastLoginAt: Date | null;
}

interface Props {
  tenantId: string;
  tenantSlug: string;
  initialUsers: UserItem[];
  currentUserId: string;
}

export default function UserListClient({ tenantId, tenantSlug, initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  async function refreshUsers() {
    const res = await listTenantUsersAction(tenantId);
    if (res.success && res.data) {
      setUsers(res.data);
    }
  }

  async function handleDelete(userId: string) {
    if (userId === currentUserId) {
      toast.error("No puedes eliminar tu propio usuario");
      return;
    }
    
    if (!confirm("¿Estás seguro de eliminar este usuario? No podrá volver a ingresar al sistema.")) {
      return;
    }

    setIsDeleting(userId);
    try {
      const res = await deleteUserAction(userId);
      if (res.success) {
        toast.success("Usuario eliminado correctamente");
        await refreshUsers();
      } else {
        toast.error(res.error || "Error al eliminar usuario");
      }
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <>
      <div className="card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "hsl(210, 40%, 98%)" }}>
            Usuarios del Sistema
          </h2>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary"
            style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
          >
            <UserPlus size={16} />
            Crear Guardia
          </button>
        </div>

        <div className="table-responsive">
          <table className="table" style={{ minWidth: "800px" }}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Credenciales</th>
                <th>Rol</th>
                <th>Último Acceso</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontWeight: 500, color: "hsl(210, 40%, 98%)" }}>{user.name}</div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {user.username && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "hsl(215, 25%, 65%)" }}>
                          <User size={14} />
                          {user.username}
                        </div>
                      )}
                      {user.email && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "hsl(215, 25%, 65%)" }}>
                          <Mail size={14} />
                          {user.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        padding: "0.25rem 0.625rem",
                        borderRadius: "1rem",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        background: user.role === "superadmin" ? "hsl(280, 80%, 20%)" : "hsl(221, 83%, 20%)",
                        color: user.role === "superadmin" ? "hsl(280, 80%, 75%)" : "hsl(221, 83%, 75%)",
                      }}
                    >
                      {user.role === "superadmin" ? <ShieldCheck size={12} /> : <Shield size={12} />}
                      {user.role === "superadmin" ? "Super Admin" : "Guardia (Admin)"}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.875rem", color: "hsl(215, 25%, 65%)" }}>
                      {user.lastLoginAt ? format(new Date(user.lastLoginAt), "dd MMM yyyy, HH:mm", { locale: es }) : "Nunca"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => setResetUserId(user.id)}
                        className="btn-secondary"
                        title="Cambiar Contraseña"
                        style={{ padding: "0.4rem" }}
                      >
                        <KeyRound size={16} />
                      </button>
                      {user.id !== currentUserId && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={isDeleting === user.id}
                          className="btn-secondary"
                          title="Eliminar Usuario"
                          style={{ padding: "0.4rem", color: "hsl(0, 70%, 65%)", borderColor: "transparent" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "hsl(215, 25%, 55%)" }}>
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={refreshUsers}
        tenantId={tenantId}
      />

      <ResetPasswordModal
        isOpen={!!resetUserId}
        onClose={() => setResetUserId(null)}
        userId={resetUserId ?? ""}
        onSuccess={refreshUsers}
      />
    </>
  );
}
