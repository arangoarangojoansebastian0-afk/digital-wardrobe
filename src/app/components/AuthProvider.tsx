"use client";
 
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
 
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    // Verificar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && pathname !== "/auth") {
        router.push("/auth");
      } else if (session && pathname === "/auth") {
        router.push("/");
      }
      setLoading(false);
    });
 
    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session && pathname !== "/auth") {
          router.push("/auth");
        } else if (session && pathname === "/auth") {
          router.push("/");
        }
      }
    );
 
    return () => subscription.unsubscribe();
  }, [pathname, router]);
 
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0E0E0F",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: "24px",
            fontWeight: 300,
            color: "#C9A84C",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Armario
        </div>
      </div>
    );
  }
 
  return <>{children}</>;
}