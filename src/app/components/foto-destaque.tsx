import Image from "next/image";
import Cantos from "./cantos";
import Filete from "./filete";

/** Quando a foto real chegar: coloque o arquivo em public/fotos/ e preencha
    este caminho (ex: "/fotos/capa.jpg") — a moldura troca sozinha do estado
    reservado para a foto, sem precisar mexer no resto do componente. */
const FOTO_DESTAQUE: string | null = null;

export default function FotoDestaque() {
  return (
    <section className="secao px-6 py-12 flex justify-center">
      <div className="moldura moldura-foto w-full max-w-sm">
        <Cantos />
        <div className="foto-quadro aspect-[4/5]">
          {FOTO_DESTAQUE ? (
            <Image
              src={FOTO_DESTAQUE}
              alt="Laura e Gu"
              fill
              sizes="(min-width: 640px) 24rem, 90vw"
              className="object-cover"
            />
          ) : (
            <div className="foto-reservada">
              <p className="font-display italic text-4xl text-champagne-light brilho-palco">
                Laura <span className="text-ivory">&amp;</span> Gu
              </p>
              <Filete className="w-16" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
