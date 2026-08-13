import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Laura & Gu | Confirme sua presença",
  description: "Convite de casamento — confirmação de presença e pagamento do after",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
