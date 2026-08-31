"use client";

import { useState } from "react";
import type { Perfil } from "@/lib/supabase-functions";

type Slide = {
  titulo: string;
  horario: string;
  dressCode: string;
  oQueVaiTer: string;
};

const SLIDES_POR_PERFIL: Record<Perfil, Slide[]> = {
  cerimonia_festa_after: [
    {
      titulo: "Cerimônia",
      horario: "[Horário de chegada / início da cerimônia]",
      dressCode: "[Dress code da cerimônia]",
      oQueVaiTer: "[Breve descrição do que esperar na cerimônia]",
    },
    {
      titulo: "Festa",
      horario: "[Horário de início da festa]",
      dressCode: "[Dress code da festa, se diferente da cerimônia]",
      oQueVaiTer: "[O que vai ter na festa: jantar, open bar, banda, pista, etc.]",
    },
    {
      titulo: "After",
      horario: "[Horário de início do after]",
      dressCode: "[Dress code do after, se diferente]",
      oQueVaiTer: "[O que vai ter no after]",
    },
  ],
  festa_after: [
    {
      titulo: "Festa",
      horario: "[Horário de início da festa]",
      dressCode: "[Dress code da festa]",
      oQueVaiTer: "[O que vai ter na festa: jantar, open bar, banda, pista, etc.]",
    },
    {
      titulo: "After",
      horario: "[Horário de início do after]",
      dressCode: "[Dress code do after, se diferente]",
      oQueVaiTer: "[O que vai ter no after]",
    },
  ],
};

export default function InfoCarousel({
  perfil,
  onContinuar,
}: {
  perfil: Perfil;
  onContinuar: () => void;
}) {
  const slides = SLIDES_POR_PERFIL[perfil];
  const [indice, setIndice] = useState(0);
  const slide = slides[indice];
  const ultimo = indice === slides.length - 1;

  return (
    <div className="moldura p-6 space-y-6 text-left">
      <div className="text-center space-y-1">
        <p className="text-xs tracking-[0.35em] uppercase eyebrow-metal font-medium">
          Antes de confirmar
        </p>
        <p className="text-platinum/70 text-xs">
          Isso ainda não é sua confirmação — dá uma olhada nas informações e confirme presença
          logo em seguida, etapa por etapa.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="font-display italic text-2xl text-champagne-light text-center">{slide.titulo}</h3>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-[11px] tracking-widest uppercase text-platinum/50">Horário</dt>
            <dd className="text-ivory/90">{slide.horario}</dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-widest uppercase text-platinum/50">Dress code</dt>
            <dd className="text-ivory/90">{slide.dressCode}</dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-widest uppercase text-platinum/50">O que vai ter</dt>
            <dd className="text-ivory/90">{slide.oQueVaiTer}</dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center justify-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.titulo}
            onClick={() => setIndice(i)}
            aria-label={`Ver informações de ${s.titulo}`}
            className={`w-2 h-2 rounded-full transition ${
              i === indice ? "bg-champagne-light" : "bg-platinum/30"
            }`}
          />
        ))}
      </div>

      <div className="flex gap-3">
        {indice > 0 && (
          <button
            onClick={() => setIndice((i) => i - 1)}
            className="px-4 py-2 rounded-sm text-sm border border-platinum/30 text-platinum/70"
          >
            Voltar
          </button>
        )}
        {!ultimo && (
          <button
            onClick={() => setIndice((i) => i + 1)}
            className="btn-metal flex-1 py-2 rounded-sm text-sm"
          >
            Próximo
          </button>
        )}
        {ultimo && (
          <button onClick={onContinuar} className="btn-metal flex-1 py-2 rounded-sm text-sm">
            Ir para confirmação de presença
          </button>
        )}
      </div>
    </div>
  );
}
