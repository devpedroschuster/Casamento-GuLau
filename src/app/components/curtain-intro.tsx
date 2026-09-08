"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Fase = "fechado" | "abrindo" | "saindo" | null;

const CHAVE_SESSAO = "cortina-vista";

/** Abertura de palco que roda uma vez por sessão ao entrar no site: a cortina
    parte ao meio, o spotlight acende e um casal em silhueta valsa por um
    instante antes de sumir — depois disso o visitante nunca mais vê. Não
    aparece na convocação dos padrinhos, que tem a própria abertura (o lacre),
    nem para quem prefere menos movimento. */
export default function CurtainIntro() {
  const pathname = usePathname();
  const [fase, setFase] = useState<Fase>("fechado");

  useEffect(() => {
    if (pathname?.startsWith("/padrinhos")) {
      setFase(null);
      return;
    }

    const prefereMenosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const jaViu = sessionStorage.getItem(CHAVE_SESSAO);
    if (prefereMenosMovimento || jaViu) {
      setFase(null);
      return;
    }

    sessionStorage.setItem(CHAVE_SESSAO, "1");
    const t1 = setTimeout(() => setFase("abrindo"), 30);
    const t2 = setTimeout(() => setFase("saindo"), 2600);
    const t3 = setTimeout(() => setFase(null), 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname]);

  if (fase === null) return null;

  return (
    <div className={`cortina-intro ${fase === "abrindo" ? "abrindo" : ""} ${fase === "saindo" ? "saindo" : ""}`} aria-hidden="true">
      <div className="cortina-spotlight" />
      <Rodopio className="cortina-valsantes" />
      <div className="cortina esquerda" />
      <div className="cortina direita" />
    </div>
  );
}

/** O rodopio: uma trilha em espiral, como a saia de um vestido pegando o giro
    de uma valsa, terminando numa centelha — a assinatura de dança do casal
    sem recorrer a uma silhueta literal. */
function Rodopio({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 220 200" fill="none" aria-hidden="true">
      <path
        d="M118.0,104.0 L119.2,103.1 L120.8,102.6 L122.7,102.7 L124.7,103.4 L126.6,104.8 L128.2,106.8 L129.2,109.4 L129.5,112.4 L129.0,115.6 L127.5,118.8 L125.1,121.7 L121.9,124.0 L117.9,125.5 L113.4,126.0 L108.7,125.3 L104.2,123.4 L100.0,120.2 L96.7,115.9 L94.4,110.6 L93.4,104.8 L93.9,98.6 L96.0,92.5 L99.7,86.9 L104.8,82.2 L111.2,78.7 L118.4,76.9 L126.1,76.9 L133.8,78.9 L141.1,82.7 L147.3,88.4 L152.1,95.7 L155.1,104.1 L156.0,113.3 L154.6,122.6 L150.9,131.6 L145.0,139.6 L137.1,146.0 L127.6,150.5 L117.1,152.6 L106.2,152.1 L95.4,148.9 L85.6,143.1 L77.3,134.8 L71.0,124.6 L67.4,113.0 L66.6,100.6 L68.9,88.1 L74.3,76.3"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M74.3,65.3 L78.3,72.3 L85.3,76.3 L78.3,80.2 L74.3,87.3 L70.4,80.2 L63.3,76.3 L70.4,72.3 Z"
        fill="#fff6e6"
      />
      <circle cx="118" cy="108" r="2.6" fill="currentColor" />
    </svg>
  );
}
