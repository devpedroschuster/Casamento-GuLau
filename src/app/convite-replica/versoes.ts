import type { Perfil } from "@/lib/supabase-functions";
import {
  AREAS_INDICACOES,
  AREAS_MAPA,
  LUZES_ABERTURA,
  LUZES_DRESS,
  PIX_AFTER,
  PRESENTES,
  type AreaClicavel,
  type Luz,
  type Presente,
} from "./dados";

export type Imagem = { src: string; largura: number; altura: number; alt: string };

export type TelaConfig = {
  imagem: Imagem;
  classe?: string;
  luzes?: { luzes: Luz[]; classe: "rc-luz-abertura" | "rc-luz-dress" };
  /** Sobrepõe a contagem regressiva ao vivo sobre as caixas desenhadas. */
  contagem?: boolean;
  /** Links invisíveis sobre botões já desenhados na imagem. */
  areas?: AreaClicavel[];
  /** 9 áreas clicáveis que abrem o modal Pix de cada presente. */
  presentes?: boolean;
  /** Botão desenhado de "Confirmar presença". */
  confirmar?: boolean;
};

export type Versao = {
  telas: TelaConfig[];
  afterConfirmada: Imagem;
  after: Imagem;
  pixAfter: string;
  presentes: Presente[];
  /** Data/hora do evento, ISO com fuso, para a contagem regressiva. */
  alvoContagem: string;
};

const pagina = (n: number, src: string): Imagem => ({
  src,
  largura: 1024,
  altura: 1536,
  alt: `Página ${n}`,
});

export const VERSAO_PRIMEIRO_HORARIO: Versao = {
  telas: [
    {
      imagem: pagina(1, "/convite/01-abertura.png"),
      classe: "rc-abertura",
      luzes: { luzes: LUZES_ABERTURA, classe: "rc-luz-abertura" },
    },
    { imagem: pagina(2, "/convite/02-contagem.jpg"), contagem: true },
    { imagem: pagina(3, "/convite/03-como-chegar.png"), areas: AREAS_MAPA },
    {
      imagem: pagina(4, "/convite/04-dress-code.png"),
      classe: "rc-dress",
      luzes: { luzes: LUZES_DRESS, classe: "rc-luz-dress" },
    },
    { imagem: pagina(5, "/convite/05-indicacoes.png"), areas: AREAS_INDICACOES },
    { imagem: pagina(6, "/convite/06-presentes.png"), presentes: true },
    { imagem: pagina(7, "/convite/07-confirmar.png"), confirmar: true },
  ],
  afterConfirmada: {
    src: "/convite/after-1-confirmada.png",
    largura: 1024,
    altura: 1536,
    alt: "Sua presença está confirmada",
  },
  after: { src: "/convite/after-2.jpg", largura: 1024, altura: 1536, alt: "After" },
  pixAfter: PIX_AFTER,
  presentes: PRESENTES,
  alvoContagem: "2026-11-28T17:00:00-03:00",
};

/** PROVISÓRIA: enquanto a arte do segundo horário não chega, a lista
    `festa_after` vê a mesma versão do primeiro horário. Quando chegar, é só
    trocar por um objeto `Versao` com as imagens, áreas e horário próprios. */
export const VERSAO_SEGUNDO_HORARIO: Versao = VERSAO_PRIMEIRO_HORARIO;

export function versaoDoPerfil(perfil: Perfil): Versao {
  return perfil === "festa_after" ? VERSAO_SEGUNDO_HORARIO : VERSAO_PRIMEIRO_HORARIO;
}
