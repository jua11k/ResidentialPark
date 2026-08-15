import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDuration(entry: Date | string, exit: Date | string | null): string {
  if (!exit) return "—";
  const start = typeof entry === "string" ? new Date(entry) : entry;
  const end = typeof exit === "string" ? new Date(exit) : exit;
  const ms = end.getTime() - start.getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours === 0) return `${minutes} min`;
  return `${hours}h ${minutes}min`;
}

export function getVehicleIcon(tipo: string): string {
  const icons: Record<string, string> = {
    carro: "🚗",
    moto: "🏍️",
    camioneta: "🚙",
    bicicleta: "🚲",
  };
  return icons[tipo] ?? "🚗";
}
