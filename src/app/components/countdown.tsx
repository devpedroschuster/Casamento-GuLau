"use client";

import { useEffect, useState } from "react";
import Cantos from "./cantos";
import FundoFoto from "./fundo-foto";

// Contagem geral até o dia do casamento, ao meio-dia — não expõe o horário específico de cada convite.
const DATA_CASAMENTO = process.env.NEXT_PUBLIC_DATA_CASAMENTO || "2026-11-28T12:00:00-03:00";

function calcular(alvo: number) {
  const diff = Math.max(0, alvo - Date.now());
  const dias = Math.floor(diff / 86400000);
  const horas = Math.floor((diff % 86400000) / 3600000);
  const minutos = Math.floor((diff % 3600000) / 60000);
  const segundos = Math.floor((diff % 60000) / 1000);
  return { dias, horas, minutos, segundos };
}

export default function Countdown() {
  const alvo = new Date(DATA_CASAMENTO).getTime();
  const [tempo, setTempo] = useState(() => calcular(alvo));

  useEffect(() => {
    const id = setInterval(() => setTempo(calcular(alvo)), 1000);
    return () => clearInterval(id);
  }, [alvo]);

  const itens = [
    { valor: tempo.dias, label: "dias" },
    { valor: tempo.horas, label: "horas" },
    { valor: tempo.minutos, label: "minutos" },
    { valor: tempo.segundos, label: "segundos" },
  ];

  return (
    <section className="secao fundo-champagne overflow-hidden py-16 text-center">
      <FundoFoto src="/dourado/countdown.png" />
      <div className="relative z-10 max-w-2xl mx-auto px-6 texto-com-sombra">
        <p className="text-xs tracking-[0.35em] uppercase eyebrow-metal font-medium mb-8">
          Contagem regressiva
        </p>
        <div className="flex justify-center gap-2 sm:gap-6">
          {itens.map((i) => (
            <div key={i.label} className="moldura px-3 sm:px-5 py-4 min-w-[66px] sm:min-w-[80px]">
              <Cantos />
              <p className="font-display text-2xl sm:text-3xl text-champagne brilho-palco">{i.valor}</p>
              <p className="text-[10px] sm:text-[11px] tracking-widest uppercase text-platinum/60 mt-1">{i.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
