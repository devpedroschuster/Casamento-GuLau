import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import StarField from "./components/star-field";
import CurtainIntro from "./components/curtain-intro";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Laura & Gu | Nosso casamento",
  description: "Casamento de Laura & Gu — história, informações e confirmação de presença",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`h-full antialiased ${cormorant.variable} ${manrope.variable}`}>
      <body className="min-h-full flex flex-col font-sans">
        <StarField />
        <CurtainIntro />
        {children}
      </body>
    </html>
  );
}