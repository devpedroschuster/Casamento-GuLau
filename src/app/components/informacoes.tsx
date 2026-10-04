import Cantos from "./cantos";
import FundoFoto from "./fundo-foto";

const CARDS = [
  {
    titulo: "Quando",
    texto:
      "28 de novembro de 2026. Confira o horário ao fazer seu check-in, ao final da página.",
  },
  {
    titulo: "Onde",
    texto: "Quintal dos Belgas — Estr. Fazenda Conceição, 605b, Morungava, Gravataí - RS.",
  },
  {
    titulo: "Sua presença",
    texto:
      "Este convite é individual e pessoal, preparado especialmente para quem o recebeu. Pedimos que confirme sua presença até 15 de outubro — isso nos ajuda a cuidar de cada detalhe com carinho.",
  },
];

export default function Informacoes() {
  return (
    <section id="informacoes" className="secao fundo-platinum overflow-hidden py-20">
      <FundoFoto src="/dourado/historia.png" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 texto-com-sombra">
        <p className="text-xs tracking-[0.35em] uppercase eyebrow-metal font-medium mb-4 text-center">
          Informações
        </p>
        <h2 className="font-display italic text-3xl mb-12 text-center">O grande dia</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {CARDS.map((c) => (
            <div key={c.titulo} className="moldura p-6">
              <Cantos />
              <h3 className="font-display italic text-xl mb-2 text-champagne text-center">{c.titulo}</h3>
              <p className="text-platinum/80 text-sm leading-relaxed text-center">{c.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}