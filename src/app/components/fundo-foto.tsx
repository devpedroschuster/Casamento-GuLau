import Image, { getImageProps } from "next/image";

/** Foto de fundo full-bleed para uma seção, com véu creme leve por cima (ver
    .fundo-foto-veu) só para garantir contraste pro texto. Precisa ser o
    primeiro filho de uma seção com `relative overflow-hidden`; o resto do
    conteúdo da seção deve ficar dentro de um `<div className="relative z-10">`.

    As fotos em public/dourado já vieram editadas pelos noivos sem nenhum
    texto/QR desenhado nelas — por isso aqui é só a foto nítida com um leve
    desfoque estético, sem precisar esconder nada.

    Celular: as artes de public/dourado são quadros verticais 2:3 (1024x1536)
    desenhados para uma tela inteira, com a decoração nas bordas e o centro
    vazio para o texto. No celular a seção costuma ficar de 2 a 5 vezes mais
    alta que o quadro, e esticar a arte pela altura (cover) mostra só uma
    faixa do meio — vazia, ampliada e borrada — e corta as bordas. Por isso,
    até 767px de largura essas artes aparecem inteiras, no tamanho natural,
    empilhadas ao longo da seção (ver .fundo-foto-quadros). Fotos que não são
    esses quadros (ex: a do hero) continuam sempre em cover. */
const ehQuadroVertical = (src: string) => src.startsWith("/dourado/");

/** Converte o srcSet do next/image (`url 1x, url 2x`) em `image-set()` pra
    usar a imagem otimizada como background, como a documentação do Next
    recomenda. */
function paraImageSet(srcSet = "") {
  const candidatos = srcSet.split(", ").map((candidato) => {
    const [url, densidade] = candidato.split(" ");
    return `url("${url}") ${densidade}`;
  });
  return `image-set(${candidatos.join(", ")})`;
}

export default function FundoFoto({ src, prioridade = false }: { src: string; prioridade?: boolean }) {
  const empilhar = ehQuadroVertical(src);
  const quadro = empilhar
    ? paraImageSet(getImageProps({ src, alt: "", width: 600, height: 900 }).props.srcSet)
    : null;

  return (
    <div className={`fundo-foto-camada${empilhar ? " fundo-foto-camada-quadros" : ""}`} aria-hidden="true">
      <Image
        src={src}
        alt=""
        fill
        sizes="100vw"
        priority={prioridade}
        className="object-cover scale-[1.02]"
      />
      {quadro && <div className="fundo-foto-quadros" style={{ "--quadro": quadro } as React.CSSProperties} />}
      <div className="fundo-foto-veu" />
    </div>
  );
}
