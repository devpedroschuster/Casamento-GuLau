import Cantos from "./cantos";
import FundoFoto from "./fundo-foto";

const FORNECEDORES = [
  {
    nome: "Solarê",
    especialidade: "Bronzeamento",
    descricao: "Bronzeamento com resultado uniforme e sofisticado, ideal para realçar sua beleza nessa ocasião especial.",
    local: "Porto Alegre - RS",
  },
  {
    nome: "Arthur Lourenci",
    especialidade: "Hair Stylist",
    descricao: "Cabelos elegantes e sofisticados, com atendimento personalizado para eventos especiais.",
    local: "Porto Alegre - RS",
  },
  {
    nome: "Dielly Braga Studio",
    especialidade: "Cabelo e Beleza",
    descricao:
      "Especialistas em penteados, unhas e produções para ocasiões especiais, com equipe experiente e atendimento exclusivo.",
    local: "Porto Alegre - RS",
  },
  {
    nome: "Jana Hair",
    especialidade: "Beauty Salon",
    descricao: "Unha e cabelo em um só lugar, com profissionais especializados e ambiente acolhedor.",
    local: "Porto Alegre - RS",
  },
];

export default function MakesCabelos() {
  return (
    <section id="makes-cabelos" className="secao fundo-platinum overflow-hidden py-20">
      <FundoFoto src="/dourado/makes-cabelos.png" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 texto-com-sombra">
        <p className="text-xs tracking-[0.35em] uppercase eyebrow-metal font-medium mb-4 text-center">
          Indicações
        </p>
        <h2 className="font-display italic text-3xl mb-3 text-center">Bronze, make e hair</h2>
        <p className="text-platinum/70 text-sm text-center max-w-lg mx-auto mb-12">
          Selecionamos alguns profissionais para que vocês possam se preparar para a nossa
          celebração com tranquilidade e se sentirem ainda mais especiais nesse momento único.
        </p>
        <div className="grid sm:grid-cols-2 gap-5">
          {FORNECEDORES.map((f) => (
            <div key={f.nome} className="moldura p-6">
              <Cantos />
              <h3 className="font-display italic text-xl text-champagne">{f.nome}</h3>
              <p className="text-[11px] tracking-widest uppercase text-platinum/50 mb-2">{f.especialidade}</p>
              <p className="text-platinum/80 text-sm leading-relaxed mb-3">{f.descricao}</p>
              <p className="text-platinum/50 text-xs">{f.local}</p>
            </div>
          ))}
        </div>
        <div className="painel-texto max-w-md mx-auto mt-10 text-center">
          <p className="text-platinum/60 text-xs">
            Nossa sugestão é agendar com antecedência para garantir o seu horário.
          </p>
          <p className="text-champagne text-xs tracking-widest uppercase mt-2">
            Descontos especiais para nossos convidados
          </p>
        </div>
      </div>
    </section>
  );
}
