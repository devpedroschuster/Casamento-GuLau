const CARDS = [
  {
    titulo: "Quando",
    texto: "28 de novembro de 2026. O horário de cada etapa depende do tipo de convite — confira ao fazer seu check-in, ao final da página.",
  },
  {
    titulo: "Onde",
    texto: "Quintal dos Belgas — Estr. Fazenda Conceição, 605b, Morungava, Gravataí - RS. O local é o mesmo para cerimônia, festa e after.",
  },
  {
    titulo: "Por que esse site",
    texto: "[Breve explicação do casal sobre o motivo de criarem um site próprio para o casamento — praticidade, organização, forma de reunir todas as informações em um só lugar.]",
  },
  {
    titulo: "Sua presença",
    texto: "[Um parágrafo sobre a importância de cada convidado estar presente nesse dia — pode ser mais pessoal e emotivo.]",
  },
];

export default function Informacoes() {
  return (
    <section id="informacoes" className="secao fundo-platinum max-w-3xl mx-auto px-6 py-20">
      <p className="text-xs tracking-[0.35em] uppercase eyebrow-metal font-medium mb-4 text-center">
        Informações
      </p>
      <h2 className="font-display italic text-3xl mb-12 text-center">O grande dia</h2>
      <div className="grid sm:grid-cols-2 gap-5">
        {CARDS.map((c) => (
          <div key={c.titulo} className="moldura p-6">
            <h3 className="font-display italic text-xl mb-2 text-champagne-light">{c.titulo}</h3>
            <p className="text-platinum/80 text-sm leading-relaxed">{c.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}