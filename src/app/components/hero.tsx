import Filete from "./filete";

export default function Hero() {
  return (
    <section className="secao fundo-champagne min-h-[85vh] flex flex-col items-center justify-center text-center px-6 py-20">
      <p className="text-xs tracking-[0.4em] uppercase eyebrow-metal font-medium mb-4">
        Vamos nos casar
      </p>
      <h1 className="font-display italic text-6xl sm:text-7xl leading-none brilho-palco">
        Laura <span className="text-champagne-light">&amp;</span> Gu
      </h1>
      <Filete className="my-8" />
      <p className="text-platinum/80 text-sm tracking-widest uppercase">
        28 de novembro de 2026 · Gravataí, RS
      </p>
    </section>
  );
}