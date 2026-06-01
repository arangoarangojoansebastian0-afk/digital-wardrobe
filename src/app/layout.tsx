import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import { SpeedInsights } from '@vercel/speed-insights/next';


export const metadata: Metadata = {
  title: "Armario Digital",
  description: "Tu armario inteligente con IA",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body 
        className="min-h-full"
        style={{ 
          margin: 0, 
          padding: 0, 
          background: "var(--background)",
          overflowX: "hidden" // Evita que la pantalla se mueva hacia los lados en el celular
        }}
      >
        <AuthProvider>

          {/* CONTENEDOR FLEX DE LA APP */}
          <div
            style={{
              display: "flex",
              width: "100vw",
              minHeight: "100vh",
            }}
          >

            {/* CONTENEDOR ADAPTABLE PRINCIPAL PARA LAS VENTANAS (CHAT, AJUSTES, ETC.) */}
            <main
              style={{
                flex: 1, // Obliga a la ventana a tomar todo el ancho restante al lado del sidebar
                display: "flex",
                flexDirection: "column",
                minWidth: 0, // Evita que componentes con textos largos o códigos del Chat de IA rompan el layout
                position: "relative",
              }}
            >

              {children}

            </main>

          </div>

        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}