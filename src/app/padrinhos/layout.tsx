import type { Metadata } from "next";
import { Bodoni_Moda } from "next/font/google";
import "./convocacao.css";

// A didone entra só nesta rota: é a voz da palavra "CONVOCADOS" e dos numerais
// da data, e não tem uso no resto do site.
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Convocação dos padrinhos | Laura & Gu",
  description: "Comunicado reservado aos padrinhos de Laura e Gustavo.",
  // A página não é secreta de verdade — o endereço é o segredo. O noindex
  // impede que ela apareça em busca; de propósito, não a listamos no
  // robots.txt, que só serviria para anunciar o caminho a quem o lesse.
  robots: { index: false, follow: false },
};

export default function PadrinhosLayout({ children }: { children: React.ReactNode }) {
  return <div className={bodoni.variable}>{children}</div>;
}
