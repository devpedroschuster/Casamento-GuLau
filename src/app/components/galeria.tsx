import Image from "next/image";
import Cantos from "./cantos";

const TOTAL_SLOTS = 4;

/** Mesma ideia da foto de destaque: quando as fotos chegarem, coloque os
    arquivos em public/fotos/ e liste os caminhos aqui, na ordem que quiser.
    Os espaços que sobrarem (além do array) ficam reservados. */
const FOTOS_GALERIA: string[] = [];

export default function Galeria() {
  return (
    <section id="album" className="secao max-w-3xl mx-auto px-6 py-20">
      <p className="text-xs tracking-[0.35em] uppercase eyebrow-metal font-medium mb-4 text-center">
        Nosso álbum
      </p>
      <h2 className="font-display italic text-3xl mb-12 text-center">Alguns momentos</h2>
      <div className="flex gap-4 overflow-x-auto sm:grid sm:grid-cols-4 sm:overflow-visible pb-2">
        {Array.from({ length: TOTAL_SLOTS }).map((_, i) => (
          <div key={i} className="moldura moldura-foto shrink-0 w-40 sm:w-auto">
            <Cantos />
            <div className="foto-quadro aspect-square">
              {FOTOS_GALERIA[i] ? (
                <Image
                  src={FOTOS_GALERIA[i]}
                  alt="Laura e Gu"
                  fill
                  sizes="(min-width: 640px) 20vw, 40vw"
                  className="object-cover"
                />
              ) : (
                <div className="foto-reservada">
                  <svg viewBox="0 0 16 16" className="w-5 h-5 text-champagne-light/70" fill="currentColor" aria-hidden="true">
                    <path d="M8 0 L9.2 6.8 L16 8 L9.2 9.2 L8 16 L6.8 9.2 L0 8 L6.8 6.8Z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
