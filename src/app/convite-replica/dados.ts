// Dados do convite interativo, copiados literalmente do HTML de referência
// (convite_Laura_Gustavo_presentes_pix-2.html). Posições em % da própria tela.

export const PIX_AFTER =
  "00020101021126750014br.gov.bcb.pix01365e679437-ee49-4dc3-9e96-a347f2ea92650213afterlauraegu520400005303986540585.905802BR5919GUSTAVO DOS S SILVA6012PORTO ALEGRE62070503***63049BC6";

export type Presente = { nome: string; valor: string; pix: string };

export const PRESENTES: Presente[] = [
  {
    nome: "As tranças de um careca",
    valor: "R$ 199,99",
    pix: "00020101021126720014br.gov.bcb.pix0123afterlauraegu@gmail.com0223as trancas de um careca5204000053039865406199.995802BR5919GUSTAVO DOS S SILVA6012PORTO ALEGRE62070503***6304A3F2",
  },
  {
    nome: "Massagem aos noivos",
    valor: "R$ 450,00",
    pix: "00020101021126680014br.gov.bcb.pix0123afterlauraegu@gmail.com0219massagem aos noivos5204000053039865406450.005802BR5919GUSTAVO DOS S SILVA6012PORTO ALEGRE62070503***6304AEFC",
  },
  {
    nome: "Japa neles",
    valor: "R$ 380,00",
    pix: "00020101021126590014br.gov.bcb.pix0123afterlauraegu@gmail.com0210japa neles5204000053039865406380.005802BR5919GUSTAVO DOS S SILVA6012PORTO ALEGRE62070503***63043536",
  },
  {
    nome: "Ai tu veio",
    valor: "R$ 3.000,00",
    pix: "00020101021126590014br.gov.bcb.pix0123afterlauraegu@gmail.com0210ai tu veio52040000530398654073000.005802BR5919GUSTAVO DOS S SILVA6012PORTO ALEGRE62070503***6304ABED",
  },
  {
    nome: "Maroto",
    valor: "R$ 150,00",
    pix: "00020101021126550014br.gov.bcb.pix0123afterlauraegu@gmail.com0206maroto5204000053039865406150.005802BR5919GUSTAVO DOS S SILVA6012PORTO ALEGRE62070503***630453B0",
  },
  {
    nome: "A noiva merece",
    valor: "R$ 400,00",
    pix: "00020101021126630014br.gov.bcb.pix0123afterlauraegu@gmail.com0214a noiva merece5204000053039865406400.005802BR5919GUSTAVO DOS S SILVA6012PORTO ALEGRE62070503***63048FF2",
  },
  {
    nome: "Vai dá trabaio",
    valor: "R$ 500,00",
    pix: "00020101021126630014br.gov.bcb.pix0123afterlauraegu@gmail.com0214vai da trabaio5204000053039865406500.005802BR5919GUSTAVO DOS S SILVA6012PORTO ALEGRE62070503***630494C6",
  },
  {
    nome: "E 2 palitos",
    valor: "R$ 600,00",
    pix: "00020101021126600014br.gov.bcb.pix0123afterlauraegu@gmail.com0211e 2 palitos5204000053039865406600.005802BR5919GUSTAVO DOS S SILVA6012PORTO ALEGRE62070503***6304CE8A",
  },
  {
    nome: "Taaa",
    valor: "R$ 99,90",
    pix: "00020101021126530014br.gov.bcb.pix0123afterlauraegu@gmail.com0204taaa520400005303986540599.905802BR5919GUSTAVO DOS S SILVA6012PORTO ALEGRE62070503***6304F264",
  },
];

/** Topo (em %) da área clicável de cada presente, na mesma ordem de PRESENTES. */
export const PRESENTES_TOPO = [23.05, 29.82, 36.62, 43.45, 50.27, 57.1, 63.92, 70.74, 77.56];

export type AreaClicavel = {
  rotulo: string;
  href: string;
  esq: number;
  topo: number;
  larg: number;
  alt: number;
  z?: number;
  alvo?: "_blank" | "_self";
  rel?: string;
};

export const AREAS_MAPA: AreaClicavel[] = [
  {
    rotulo: "Abrir no Google Maps",
    href: "https://www.google.com/maps/search/?api=1&query=Quintal+dos+Belgas%2C+Estrada+Municipal+Fazenda+Conceicao+605+B%2C+Morungava%2C+Gravatai%2C+RS",
    esq: 23,
    topo: 70,
    larg: 27,
    alt: 14,
    alvo: "_blank",
    rel: "noopener",
  },
  {
    rotulo: "Abrir no Waze",
    href: "https://waze.com/ul?q=Quintal%20dos%20Belgas%2C%20Estrada%20Municipal%20Fazenda%20Concei%C3%A7%C3%A3o%20605%20B%2C%20Morungava%2C%20Gravata%C3%AD%2C%20RS&navigate=yes",
    esq: 51.5,
    topo: 70,
    larg: 27,
    alt: 14,
    alvo: "_self",
  },
];

const EXTERNO = { alvo: "_blank", rel: "noopener noreferrer" } as const;

export const AREAS_INDICACOES: AreaClicavel[] = [
  {
    rotulo: "Abrir Instagram da Solarê Bronzeamento",
    href: "https://www.instagram.com/solarebronzestudio_?stkn=MTF1bXAwbnl4bTN1",
    esq: 28.3,
    topo: 48.6,
    larg: 7.2,
    alt: 4.1,
    z: 10,
    ...EXTERNO,
  },
  {
    rotulo: "Abrir WhatsApp da Solarê Bronzeamento",
    href: "https://wa.me/5551999250013",
    esq: 37.6,
    topo: 48.6,
    larg: 7,
    alt: 4.2,
    z: 20,
    ...EXTERNO,
  },
  {
    rotulo: "Abrir Instagram da Dielly Braga Studio",
    href: "https://www.instagram.com/diellystudioo?stkn=bXdjOXhucWs3ZHdk",
    esq: 29.9,
    topo: 73.7,
    larg: 7,
    alt: 4.2,
    z: 10,
    ...EXTERNO,
  },
  {
    rotulo: "Abrir WhatsApp da Dielly Braga Studio",
    href: "https://wa.me/5551982507680",
    esq: 37.6,
    topo: 73.7,
    larg: 7,
    alt: 4.2,
    z: 10,
    ...EXTERNO,
  },
  {
    rotulo: "Abrir Instagram da Jana Hair",
    href: "https://www.instagram.com/jana.hairbeaty?stkn=bnZseHo5Y2I4cXR6",
    esq: 76.3,
    topo: 73.7,
    larg: 7,
    alt: 4.2,
    z: 10,
    ...EXTERNO,
  },
  {
    rotulo: "Abrir WhatsApp da Jana Hair",
    href: "https://wa.me/5551991382017",
    esq: 84,
    topo: 73.7,
    larg: 7,
    alt: 4.2,
    z: 10,
    ...EXTERNO,
  },
  {
    rotulo: "Abrir Instagram do Arthur Lourenci",
    href: "https://www.instagram.com/studio.arthurlourenci?stkn=d3h1azlmZDUxcmVl",
    esq: 76.3,
    topo: 48.6,
    larg: 7,
    alt: 4.2,
    z: 10,
    ...EXTERNO,
  },
  {
    rotulo: "Abrir WhatsApp do Arthur Lourenci",
    href: "https://wa.me/5551984314885",
    esq: 84,
    topo: 48.6,
    larg: 7,
    alt: 4.2,
    z: 10,
    ...EXTERNO,
  },
];

export type Luz = { esq?: number; dir?: number; topo: number; atraso: number };

export const LUZES_ABERTURA: Luz[] = [
  { esq: 8, topo: 15, atraso: 0.2 },
  { esq: 10, topo: 34, atraso: 1.4 },
  { esq: 8, topo: 63, atraso: 2.3 },
  { dir: 9, topo: 18, atraso: 1 },
  { dir: 8, topo: 39, atraso: 2.7 },
  { dir: 10, topo: 67, atraso: 0.8 },
  { esq: 28, topo: 91, atraso: 1.9 },
  { dir: 27, topo: 89, atraso: 3 },
];

export const LUZES_DRESS: Luz[] = [
  { esq: 3.5, topo: 57, atraso: 0.15 },
  { esq: 7, topo: 64, atraso: 1.05 },
  { esq: 2.5, topo: 72, atraso: 1.85 },
  { esq: 96.5, topo: 56, atraso: 0.65 },
  { esq: 93, topo: 64, atraso: 1.55 },
  { esq: 97, topo: 72, atraso: 2.25 },
  { esq: 11, topo: 69, atraso: 2 },
  { esq: 89, topo: 69, atraso: 0.9 },
];
