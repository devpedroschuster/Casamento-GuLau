import Filete from "./filete";
import FundoFoto from "./fundo-foto";

export default function Hero() {
  return (
    <section className="secao fundo-champagne overflow-hidden min-h-[85vh] flex flex-col items-center justify-center text-center px-6 py-20">
      <FundoFoto src="/fundo-convite.jpg" prioridade />
      <div className="relative z-10 flex flex-col items-center texto-com-sombra">
        
        <h1 className="font-display italic text-6xl sm:text-7xl leading-none brilho-palco">
          Laura <span className="text-champagne">&amp;</span> Gu
        </h1>
        <Filete className="my-8" />
        <p className="text-black/80 text-sm tracking-widest uppercase texto-com-sombra">
          28 de novembro de 2026 · Gravataí, RS
        </p>
      </div>
    </section>
  );
}
