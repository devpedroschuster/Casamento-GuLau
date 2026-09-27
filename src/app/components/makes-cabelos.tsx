import Cantos from "./cantos";

const FORNECEDORES = [
  {
    nome: "Laura Barros",
    especialidade: "Makeup Artist",
    descricao: "Makes elegantes e sofisticadas, com atendimento personalizado para eventos especiais.",
    local: "Porto Alegre - RS",
  },
  {
    nome: "Studio Bella Forma",
    especialidade: "Cabelos e Beleza",
    descricao:
      "Especialistas em penteados, ondas e produções para ocasiões especiais, com equipe experiente e atendimento exclusivo.",
    local: "Porto Alegre - RS",
  },
  {
    nome: "Noir Beauty Space",
    especialidade: "Make & Hair",
    descricao: "Make e cabelo em um só lugar, com profissionais especializados e ambiente moderno e acolhedor.",
    local: "Porto Alegre - RS",
  },
  {
    nome: "Espaço Tessa",
    especialidade: "Beleza e Estilo",
    descricao: "Produções personalizadas para que você se sinta incrível, com foco em maquiagem e penteados para eventos.",
    local: "Porto Alegre - RS",
  },
];

export default function MakesCabelos() {
  return (
    <section id="makes-cabelos" className="secao fundo-platinum max-w-3xl mx-auto px-6 py-20">
      <p className="text-xs tracking-[0.35em] uppercase eyebrow-metal font-medium mb-4 text-center">
        Indicações
      </p>
      <h2 className="font-display italic text-3xl mb-3 text-center">Makes e cabelos</h2>
      <p className="text-platinum/70 text-sm text-center max-w-lg mx-auto mb-12">
        Selecionamos alguns profissionais para que vocês possam se preparar para a nossa
        celebração com tranquilidade e se sentirem ainda mais especiais nesse momento único.
      </p>
      <div className="grid sm:grid-cols-2 gap-5">
        {FORNECEDORES.map((f) => (
          <div key={f.nome} className="moldura p-6">
            <Cantos />
            <h3 className="font-display italic text-xl text-champagne-light">{f.nome}</h3>
            <p className="text-[11px] tracking-widest uppercase text-platinum/50 mb-2">{f.especialidade}</p>
            <p className="text-platinum/80 text-sm leading-relaxed mb-3">{f.descricao}</p>
            <p className="text-platinum/50 text-xs">{f.local}</p>
          </div>
        ))}
      </div>
      <p className="text-platinum/60 text-xs text-center mt-10">
        Nossa sugestão é agendar com antecedência para garantir o seu horário.
      </p>
    </section>
  );
}
