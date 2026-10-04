import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Laura & Gu",
  description: "Painel interno de controle de convidados.",
  // A página não é secreta de verdade — o endereço é o segredo. O noindex
  // impede que ela apareça em busca; de propósito, não a listamos em
  // lugar nenhum do site.
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
