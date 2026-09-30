import Image from "next/image";

/** Foto de fundo full-bleed para uma seção, com véu creme leve por cima (ver
    .fundo-foto-veu) só para garantir contraste pro texto. Precisa ser o
    primeiro filho de uma seção com `relative overflow-hidden`; o resto do
    conteúdo da seção deve ficar dentro de um `<div className="relative z-10">`.

    As fotos em public/dourado já vieram editadas pelos noivos sem nenhum
    texto/QR desenhado nelas — por isso aqui é só a foto nítida com um leve
    desfoque estético, sem precisar esconder nada. */
export default function FundoFoto({ src, prioridade = false }: { src: string; prioridade?: boolean }) {
  return (
    <div className="fundo-foto-camada" aria-hidden="true">
      <Image
        src={src}
        alt=""
        fill
        sizes="100vw"
        priority={prioridade}
        className="object-cover scale-[1.02]"
      />
      <div className="fundo-foto-veu" />
    </div>
  );
}
