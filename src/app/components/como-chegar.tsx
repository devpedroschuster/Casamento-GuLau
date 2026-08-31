const NOME_LOCAL = "Quintal dos Belgas";
const ENDERECO = "Estr. Fazenda Conceição, 605b - Morungava, Gravataí - RS, 94250-030";

export default function ComoChegar() {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${NOME_LOCAL}, ${ENDERECO}`
  )}`;
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(`${NOME_LOCAL}, ${ENDERECO}`)}&navigate=yes`;

  return (
    <section id="como-chegar" className="secao fundo-rose max-w-2xl mx-auto px-6 py-20 text-center">
      <p className="text-xs tracking-[0.35em] uppercase eyebrow-metal font-medium mb-4">
        Como chegar
      </p>
      <h2 className="font-display italic text-3xl mb-2">{NOME_LOCAL}</h2>
      <p className="text-platinum/80 text-sm mb-8">{ENDERECO}</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn-metal px-6 py-3 rounded-sm text-sm">
          Abrir no Google Maps
        </a>
        <a
          href={wazeUrl}
          target="_blank"
          rel="noreferrer"
          className="px-6 py-3 rounded-sm text-sm border border-platinum/30 text-platinum hover:border-champagne transition"
        >
          Abrir no Waze
        </a>
      </div>
    </section>
  );
}