import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rodrigues Dantas Advocacia",
  description: "Sistema de gestão do escritório Rodrigues Dantas Advocacia Associada",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
