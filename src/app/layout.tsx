import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "./components/AuthProvider";
 
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
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
 