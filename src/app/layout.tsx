import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "ResidentialPark — Gestión de Parqueaderos Residenciales",
  description: "Sistema de control de acceso vehicular para conjuntos residenciales. Registro de ingresos y salidas en tiempo real.",
  keywords: ["parqueadero", "conjunto residencial", "control de acceso", "gestión vehicular"],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-visual",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "hsl(223, 47%, 10%)",
              border: "1px solid hsl(220, 20%, 22%)",
              color: "hsl(210, 40%, 98%)",
            },
          }}
        />
      </body>
    </html>
  );
}
