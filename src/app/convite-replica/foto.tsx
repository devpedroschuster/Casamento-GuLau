import Image from "next/image";
import type { Imagem } from "./versoes";

/** Imagem de tela inteira, servida sem recompressão (`unoptimized`). Só a capa
    usa `preload`; as demais carregam já ("eager"), como no HTML original. */
export default function Foto({
  imagem,
  prioridade = false,
  imgRef,
  aoCarregar,
}: {
  imagem: Imagem;
  prioridade?: boolean;
  imgRef?: React.Ref<HTMLImageElement>;
  aoCarregar?: () => void;
}) {
  return (
    <Image
      ref={imgRef}
      src={imagem.src}
      alt={imagem.alt}
      width={imagem.largura}
      height={imagem.altura}
      unoptimized
      preload={prioridade}
      loading={prioridade ? undefined : "eager"}
      onLoad={aoCarregar}
    />
  );
}
