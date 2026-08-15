import * as XLSX from "xlsx";

export interface ParsedXlsxRow {
  placa: string;
  tipo: string;
  propietario: string;
  apartamento: string;
  bloque: string;
  telefono: string;
  email: string;
}

/**
 * Parsea un archivo XLSX y retorna las filas en el formato esperado.
 * Columnas esperadas (case-insensitive): Placa | Vehículo | Propietario | Apartamento | Bloque | Telefono contacto | Correo electrónico
 */
export function parseXlsxFile(file: ArrayBuffer): ParsedXlsxRow[] {
  const workbook = XLSX.read(file, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  return rawRows.map((row) => {
    // Normalizar claves (lowercase sin espacios)
    const normalized: Record<string, string> = {};
    for (const key of Object.keys(row)) {
      normalized[key.toLowerCase().trim().replace(/\s+/g, "_")] = String(row[key]).trim();
    }

    return {
      placa: normalized["placa"] || normalized["plate"] || "",
      tipo: normalized["vehículo"] || normalized["vehiculo"] || normalized["tipo"] || "carro",
      propietario: normalized["propietario"] || normalized["owner"] || normalized["nombre"] || "",
      apartamento: normalized["apartamento"] || normalized["apto"] || normalized["apt"] || "",
      bloque: normalized["bloque"] || normalized["block"] || normalized["torre"] || "",
      telefono: normalized["telefono_contacto"] || normalized["telefono"] || normalized["phone"] || "",
      email: normalized["correo_electrónico"] || normalized["correo"] || normalized["email"] || "",
    };
  });
}

/**
 * Genera un archivo XLSX de plantilla para importación masiva.
 */
export function generateXlsxTemplate(): Uint8Array {
  const headers = [
    "Placa",
    "Vehículo",
    "Propietario",
    "Apartamento",
    "Bloque",
    "Telefono contacto",
    "Correo electrónico",
  ];

  const exampleRows = [
    ["ABC123", "carro", "Juan Pérez", "101", "Torre A", "3001234567", "juan@email.com"],
    ["XYZ789", "moto", "María López", "202", "Torre B", "3109876543", "maria@email.com"],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Vehículos");

  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}
