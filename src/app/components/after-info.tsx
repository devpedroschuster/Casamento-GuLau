const ITENS = [
  "Piscinas",
  "Alojamentos",
  "Campos de futebol",
  "DJ",
  "Samba de roda",
  "Cachorro-quente",
  "Pipoca",
];

export default function AfterInfo() {
  return (
    <section id="after" className="secao fundo-rose max-w-2xl mx-auto px-6 py-20 text-center">
      <p className="text-xs tracking-[0.35em] uppercase eyebrow-metal font-medium mb-4">Depois da festa</p>
      <h2 className="font-display italic text-3xl mb-6">O After</h2>
      <div className="space-y-4 text-platinum/80 leading-relaxed text-[15px] mb-8">
        <p>Porque a celebração não precisa terminar quando a festa acaba.</p>
        <p>
          Para quem quiser continuar essa experiência com a gente, <em>a festa segue!</em> Vamos
          aproveitar toda a estrutura do sítio para prolongar o momento com muita música, diversão
          e convivência.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {ITENS.map((item) => (
          <span
            key={item}
            className="text-[11px] tracking-widest uppercase text-platinum/80 border border-champagne/30 rounded-full px-4 py-2"
          >
            {item}
          </span>
        ))}
      </div>
      <p className="text-platinum/70 text-sm">O After tem o valor de</p>
      <p className="font-display text-4xl text-champagne-light brilho-palco mb-2">R$ 79,90</p>
      <p className="text-platinum/70 text-sm mb-8">por pessoa, com pagamento antecipado via Pix.</p>
      <div className="space-y-2 text-platinum/60 text-xs mb-8">
        <p>A participação é opcional, mas as vagas são limitadas.</p>
        <p>O pagamento antecipado garante seu lugar no After.</p>
      </div>
      <p className="text-platinum/70 text-sm mb-6">
        A confirmação e o pagamento são feitos no check-in, ao final da página.
      </p>
      <p className="font-display italic text-xl text-champagne-light">
        Porque nem tudo que é bom precisa acabar rápido demais.
      </p>
    </section>
  );
}
