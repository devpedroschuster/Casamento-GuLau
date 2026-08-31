"use client";

import { useEffect, useState } from "react";

// Contagem geral até o dia do casamento, ao meio-dia — não expõe o horário específico de cada convite.
const DATA_CASAMENTO = process.env.NEXT_PUBLIC_DATA_CASAMENTO || "2026-11-28T12:00:00-03:00";

function calcular(alvo: number) {
  const diff = Math.max(0, alvo - Date.now());
  const dias = Math.floor(diff / 86400000);
  const horas = Math.floor((diff % 86400000) / 3600000);
  const minutos = Math.floor((diff % 3600000) / 60000);
  return { dias, horas, minutos };
}

export default function Countdown() {
  const alvo = new Date(DATA_CASAMENTO).getTime();
  const [tempo, setTempo] = useState(() => calcular(alvo));

  useEffect(() => {
    const id = setInterval(() => setTempo(calcular(alvo)), 60_000);
    return () => clearInterval(id);
  }, [alvo]);

  const itens = [
    { valor: tempo.dias, label: "dias" },
    { valor: tempo.horas, label: "horas" },
    { valor: tempo.minutos, label: "minutos" },
  ];

  return (
    <section className="secao fundo-champagne max-w-2xl mx-auto px-6 py-16 text-center">
      <p className="text-xs tracking-[0.35em] uppercase eyebrow-metal font-medium mb-8">
        Contagem regressiva
      </p>
      <div className="flex justify-center gap-4 sm:gap-8">
        {itens.map((i) => (
          <div key={i.label} className="moldura px-5 py-4 min-w-[80px]">
            <p className="font-display text-3xl text-champagne-light">{i.valor}</p>
            <p className="text-[11px] tracking-widest uppercase text-platinum/60 mt-1">{i.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}