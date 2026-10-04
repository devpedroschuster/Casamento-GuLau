# Réplica do convite interativo — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a home `/` desta branch por uma réplica fiel do convite interativo (HTML de referência), com as mesmas telas, animações, links e códigos Pix.

**Architecture:** Cada tela é uma imagem 1024×1536 servida sem recompressão (`next/image` com `unoptimized`), com áreas clicáveis posicionadas em % da própria tela. Um único componente cliente (`convite-replica.tsx`) guarda a máquina de estados (capa → site → After), a contagem regressiva e o modal Pix. O CSS é portado do HTML com prefixo `.rc-`; dados (Pix, links, posições) ficam em `dados.ts`.

**Tech Stack:** Next.js 16.3 (App Router, Turbopack), React 19, TypeScript, CSS puro (arquivo importado pelo componente). Sem framework de testes no repositório: a verificação é `tsc`, `lint`, `build`, uma checagem em Node dos códigos Pix e a comparação no navegador contra o HTML de referência reconstruído.

**Spec:** `docs/superpowers/specs/2026-10-03-convite-replica-design.md`

## Global Constraints

- Conteúdo, textos, links e Pix vêm do HTML `convite_Laura_Gustavo_presentes_pix-2.html`; o PDF só orienta layout e ordem.
- Imagens servidas byte a byte (`next/image` + `unoptimized`), `width`/`height` reais (1024×1536; capa 864×1536).
- Celular: idêntico ao HTML. Desktop (≥ 700 px): coluna de 520 px centralizada, áreas clicáveis alinhadas à imagem.
- Sem backend: "Confirmar presença" só abre a sequência confirmada → After. Nada é gravado.
- Contagem regressiva ao vivo até `2026-11-28T17:00:00-03:00`.
- After: confirmada visível por 5200 ms, 350 ms de intervalo, depois a tela do After; fade de 1,2 s.
- Modal Pix copia o código 60 ms depois de abrir.
- `/admin`, `/padrinhos`, `src/app/api` e `supabase/` não mudam.
- Lint: no máximo os 5 problemas que já existem em `origin/main` (3 erros, 2 avisos). `tsc` limpo.
- AGENTS.md: este Next.js tem mudanças incompatíveis; consulte `node_modules/next/dist/docs/` quando houver dúvida de API.
- Mensagens de commit terminam com `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

Pasta com os arquivos extraídos do HTML (usada abaixo como `$EXTRAIDOS`):
`C:/Users/pedro/AppData/Local/Temp/claude/C--Users-pedro-Desktop-Eu-Projetos-casamentogulau/35af0ea7-babe-4f36-8b41-0d124d0d5562/scratchpad`
(`htmlimgs/h0..h9`, `ref-stripped.html`).

---

### Task 1: Imagens e dados (Pix, links, posições)

**Files:**
- Create: `public/convite/capa.jpg`, `01-abertura.png`, `02-contagem.jpg`, `03-como-chegar.png`, `04-dress-code.png`, `05-indicacoes.png`, `06-presentes.png`, `07-confirmar.png`, `after-1-confirmada.png`, `after-2.jpg`
- Create: `src/app/convite-replica/dados.ts`

**Interfaces:**
- Produces (`dados.ts`):
  - `PIX_AFTER: string`
  - `type Presente = { nome: string; valor: string; pix: string }`, `PRESENTES: Presente[]` (9 itens), `PRESENTES_TOPO: number[]` (9 valores em %)
  - `type AreaClicavel = { rotulo: string; href: string; esq: number; topo: number; larg: number; alt: number; z?: number; alvo?: "_blank" | "_self"; rel?: string }`
  - `AREAS_MAPA`, `AREAS_INDICACOES: AreaClicavel[]`
  - `type Luz = { esq?: number; dir?: number; topo: number; atraso: number }`, `LUZES_ABERTURA`, `LUZES_DRESS: Luz[]`

- [ ] **Step 1: Copiar as 10 imagens**

```bash
EXTRAIDOS="C:/Users/pedro/AppData/Local/Temp/claude/C--Users-pedro-Desktop-Eu-Projetos-casamentogulau/35af0ea7-babe-4f36-8b41-0d124d0d5562/scratchpad"
mkdir -p public/convite
cp "$EXTRAIDOS/htmlimgs/h0.jpg" public/convite/capa.jpg
cp "$EXTRAIDOS/htmlimgs/h1.png" public/convite/01-abertura.png
cp "$EXTRAIDOS/htmlimgs/h2.jpg" public/convite/02-contagem.jpg
cp "$EXTRAIDOS/htmlimgs/h3.png" public/convite/03-como-chegar.png
cp "$EXTRAIDOS/htmlimgs/h4.png" public/convite/04-dress-code.png
cp "$EXTRAIDOS/htmlimgs/h5.png" public/convite/05-indicacoes.png
cp "$EXTRAIDOS/htmlimgs/h6.png" public/convite/06-presentes.png
cp "$EXTRAIDOS/htmlimgs/h7.png" public/convite/07-confirmar.png
cp "$EXTRAIDOS/htmlimgs/h8.png" public/convite/after-1-confirmada.png
cp "$EXTRAIDOS/htmlimgs/h9.jpg" public/convite/after-2.jpg
```

Ordem no HTML: capa = 1ª `<img>` do `#cover`; telas 1–7 = `Página 1..7`; `after-1` = "Sua presença está confirmada"; `after-2` = "After".

- [ ] **Step 2: Conferir dimensões**

```bash
python -c "
import pymupdf,glob
for f in sorted(glob.glob('public/convite/*')):
    p=pymupdf.Pixmap(f); print(f,p.width,p.height)
"
```

Esperado: `capa.jpg` 864×1536 e as outras 9 imagens 1024×1536.

- [ ] **Step 3: Criar `src/app/convite-replica/dados.ts`**

```ts
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
```

- [ ] **Step 4: Conferir os Pix contra o HTML e validar o CRC**

Criar `$EXTRAIDOS/verificar-pix.mjs` (fora do repositório):

```js
import fs from "node:fs";
const raiz = "C:/Users/pedro/Desktop/Eu/Projetos/casamentogulau/.claude/worktrees/convite-replica";
const extraidos = "C:/Users/pedro/AppData/Local/Temp/claude/C--Users-pedro-Desktop-Eu-Projetos-casamentogulau/35af0ea7-babe-4f36-8b41-0d124d0d5562/scratchpad";
const ts = fs.readFileSync(`${raiz}/src/app/convite-replica/dados.ts`, "utf8");
const html = fs.readFileSync(`${extraidos}/ref-stripped.html`, "utf8");
const pegar = (s) => [...s.matchAll(/"(00020101[^"]+)"|'(00020101[^']+)'/g)].map((m) => m[1] ?? m[2]);
const noTs = pegar(ts);
const noHtml = pegar(html);
const crc16 = (txt) => {
  let crc = 0xffff;
  for (const b of Buffer.from(txt, "utf8")) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
};
let ok = true;
console.log("códigos no dados.ts:", noTs.length, "| no HTML:", noHtml.length);
if (noTs.length !== 10 || noHtml.length !== 10) ok = false;
for (const c of noHtml) {
  if (!noTs.includes(c)) { ok = false; console.log("FALTA no dados.ts:", c); }
}
for (const c of noTs) {
  const esperado = c.slice(-4);
  const calculado = crc16(c.slice(0, -4));
  if (esperado !== calculado) { ok = false; console.log("CRC diferente:", c.slice(0, 60), esperado, calculado); }
}
console.log(ok ? "OK: 10 códigos iguais ao HTML e com CRC válido" : "FALHOU");
process.exit(ok ? 0 : 1);
```

Run: `node "$EXTRAIDOS/verificar-pix.mjs"`
Expected: `OK: 10 códigos iguais ao HTML e com CRC válido`. Se falhar, corrija `dados.ts` até passar (não ajuste o script).

- [ ] **Step 5: Commit**

```bash
git add public/convite src/app/convite-replica/dados.ts docs/superpowers/plans
git commit -m "Add invitation images and data for the interactive replica

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Estilos portados do HTML

**Files:**
- Create: `src/app/convite-replica/convite-replica.css`

**Interfaces:**
- Produces: classes `.rc-raiz`, `.rc-capa`, `.rc-capa-moldura`, `.rc-entrar`, `.rc-energia`, `.rc-nuvem`, `.rc-site`, `.rc-pagina`, `.rc-abertura`, `.rc-dress`, `.rc-luz-abertura`, `.rc-luz-dress`, `.rc-contagem`, `.rc-celula`, `.rc-area`, `.rc-presente`, `.rc-confirmar`, `.rc-nav`, `.rc-after`, `.rc-after-slide`, `.rc-after-primeiro`, `.rc-after-segundo`, `.rc-voltar`, `.rc-pix-area`, `.rc-pix-modal`, `.rc-pix-card` e modificadores `.rc-visivel`, `.rc-ativo`, `.rc-mostrar`.

- [ ] **Step 1: Criar `src/app/convite-replica/convite-replica.css`**

```css
/* Réplica do convite interativo — CSS portado do HTML de referência
   (convite_Laura_Gustavo_presentes_pix-2.html). Valores, cores e tempos são
   os do original; só mudam os nomes (prefixo .rc-) e as correções de desktop
   (>= 700px), onde o original tem imagem colada à esquerda, áreas clicáveis
   desalinhadas e navegação fora do centro. */

html:has(.rc-raiz),
body:has(.rc-raiz) {
  background: #120d09;
}
body:has(.rc-raiz) {
  overflow-x: hidden;
}

.rc-raiz {
  font-family: Georgia, serif;
}
/* O Tailwind (preflight) faz os botões herdarem a fonte; o original usa o
   padrão do navegador. :where() mantém a especificidade em zero para as
   classes abaixo poderem sobrescrever. */
:where(.rc-raiz) button {
  font: 13.3333px system-ui, sans-serif;
}

/* ── Capa ─────────────────────────────────────────────────────────────── */
.rc-capa {
  position: fixed;
  inset: 0;
  z-index: 20;
  background: #fff;
  display: flex;
  justify-content: center;
  padding-bottom: 5px;
}
.rc-capa-moldura {
  position: relative;
  width: 100%;
  height: 100%;
}
.rc-capa-moldura img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.rc-entrar {
  position: absolute;
  bottom: 8%;
  padding: 15px 42px;
  border: 1px solid white;
  border-radius: 40px;
  background: rgba(20, 12, 6, 0.45);
  color: white;
  letter-spacing: 4px;
  font-size: 15px;
}

/* Névoa de energia dourada — uma corrente difusa atravessando o véu, do L ao G */
.rc-energia {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
  overflow: visible;
}
.rc-energia .rc-nuvem {
  fill: none;
  stroke: rgba(255, 220, 135, 0.62);
  stroke-width: 210;
  stroke-linecap: butt;
  stroke-linejoin: round;
  filter: blur(62px);
  opacity: 0.58;
  stroke-dasharray: 560 720;
  stroke-dashoffset: 0;
  animation: rcNuvem 5.6s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}
@keyframes rcNuvem {
  0% { stroke-dashoffset: 760; opacity: 0; }
  12% { opacity: 0.1; }
  25% { opacity: 0.42; }
  42% { opacity: 0.6; }
  58% { opacity: 0.56; }
  74% { opacity: 0.34; }
  90% { opacity: 0.08; }
  100% { stroke-dashoffset: -760; opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .rc-energia .rc-nuvem { animation: none; opacity: 0.14; }
}

/* ── Telas ────────────────────────────────────────────────────────────── */
.rc-site {
  display: none;
}
.rc-site.rc-visivel {
  display: block;
}
.rc-pagina {
  position: relative;
  width: 100%;
  min-height: 0;
  background: #fff;
  display: block;
  line-height: 0;
  padding-bottom: 5px;
  /* cqw = % da largura da própria tela; mantém a contagem proporcional à
     imagem também na coluna de 520px do desktop. */
  container-type: inline-size;
}
.rc-pagina img {
  width: 100%;
  height: auto;
  display: block;
  align-self: flex-start;
}

/* Contagem regressiva sobre as caixas desenhadas na tela 2 */
.rc-contagem {
  position: absolute;
  left: 12%;
  right: 12%;
  top: 23.2%;
  height: 12.2%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2.1%;
  pointer-events: none;
}
.rc-celula {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(25px, 6.1cqw, 62px);
  line-height: 1;
  color: #a56b16;
}
.rc-celula span {
  display: block;
}

/* Áreas clicáveis invisíveis sobre botões já desenhados nas imagens */
.rc-area,
.rc-presente,
.rc-confirmar {
  position: absolute;
  z-index: 10;
  display: block;
  background: transparent;
  border: 0;
}
.rc-presente {
  left: 7.5%;
  width: 85%;
  height: 6.65%;
  z-index: 20;
  padding: 0;
  margin: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.rc-confirmar {
  left: 19%;
  top: 85.5%;
  width: 62%;
  height: 7.2%;
  z-index: 20;
  cursor: pointer;
}

/* Luzes suaves e pulsantes da abertura */
.rc-abertura {
  overflow: hidden;
}
.rc-luz-abertura {
  position: absolute;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 3;
  opacity: 0.18;
  background: radial-gradient(circle, rgba(255, 255, 244, 1) 0%, rgba(255, 244, 205, 0.92) 14%, rgba(255, 225, 155, 0.62) 30%, rgba(255, 208, 125, 0.25) 52%, rgba(255, 195, 105, 0) 76%);
  filter: blur(1px) drop-shadow(0 0 9px rgba(255, 230, 170, 0.72));
  transform: translate(-50%, -50%) scale(0.62);
  animation: rcLuzAbertura 2.65s ease-in-out infinite;
  mix-blend-mode: screen;
  will-change: opacity, transform, filter;
}
@keyframes rcLuzAbertura {
  0%, 100% { opacity: 0.1; transform: translate(-50%, -50%) scale(0.58); filter: blur(2.5px) drop-shadow(0 0 2px rgba(255, 230, 170, 0.18)); }
  22% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.88); filter: blur(1.5px) drop-shadow(0 0 7px rgba(255, 230, 170, 0.52)); }
  45% { opacity: 0.92; transform: translate(-50%, -50%) scale(1.42); filter: blur(0.5px) drop-shadow(0 0 16px rgba(255, 230, 170, 0.95)); }
  58% { opacity: 0.62; transform: translate(-50%, -50%) scale(1.08); filter: blur(1px) drop-shadow(0 0 11px rgba(255, 230, 170, 0.75)); }
  78% { opacity: 0.24; transform: translate(-50%, -50%) scale(0.76); filter: blur(2px) drop-shadow(0 0 5px rgba(255, 230, 170, 0.38)); }
}
@media (prefers-reduced-motion: reduce) {
  .rc-luz-abertura { animation: none; opacity: 0.18; }
}

/* Luzes pulsantes do Dress Code — pontos de luz do fundo, longe dos bonecos */
.rc-dress {
  overflow: hidden;
}
.rc-luz-dress {
  position: absolute;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 3;
  opacity: 0.12;
  background: radial-gradient(circle, rgba(255, 255, 248, 1) 0%, rgba(255, 244, 205, 0.98) 13%, rgba(255, 225, 155, 0.72) 30%, rgba(255, 205, 125, 0.32) 52%, rgba(255, 190, 105, 0) 78%);
  filter: blur(1px) drop-shadow(0 0 7px rgba(255, 226, 170, 0.8));
  transform: translate(-50%, -50%) scale(0.55);
  animation: rcLuzDress 2.55s ease-in-out infinite;
  mix-blend-mode: screen;
  will-change: opacity, transform, filter;
}
@keyframes rcLuzDress {
  0%, 100% { opacity: 0.1; transform: translate(-50%, -50%) scale(0.52); filter: blur(2.4px) drop-shadow(0 0 2px rgba(255, 230, 175, 0.18)); }
  20% { opacity: 0.34; transform: translate(-50%, -50%) scale(0.82); filter: blur(1.3px) drop-shadow(0 0 7px rgba(255, 230, 175, 0.52)); }
  42% { opacity: 0.95; transform: translate(-50%, -50%) scale(1.35); filter: blur(0.35px) drop-shadow(0 0 14px rgba(255, 230, 175, 0.95)); }
  57% { opacity: 0.62; transform: translate(-50%, -50%) scale(1.02); filter: blur(0.8px) drop-shadow(0 0 9px rgba(255, 230, 175, 0.7)); }
  78% { opacity: 0.2; transform: translate(-50%, -50%) scale(0.68); filter: blur(2px) drop-shadow(0 0 4px rgba(255, 230, 175, 0.32)); }
}
@media (prefers-reduced-motion: reduce) {
  .rc-luz-dress { animation: none; opacity: 0.16; }
}

/* ── Navegação ────────────────────────────────────────────────────────── */
.rc-nav {
  position: fixed;
  z-index: 15;
  bottom: 16px;
  left: 50%;
  display: none;
  align-items: center;
  gap: 12px;
  padding: 7px 14px;
  border-radius: 30px;
  background: rgba(20, 12, 6, 0.7);
  color: white;
}
.rc-nav.rc-visivel {
  display: flex;
}
.rc-nav button {
  border: 0;
  background: none;
  color: white;
  font-size: 25px;
}

/* ── After ────────────────────────────────────────────────────────────── */
.rc-after {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 30;
  background: #120d09;
  overflow: hidden;
  justify-content: center;
  align-items: center;
}
.rc-after.rc-visivel {
  display: flex;
}
.rc-after-slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 1.2s ease;
  pointer-events: none;
  will-change: opacity;
}
.rc-after-slide.rc-ativo {
  opacity: 1;
}
.rc-after-slide img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  align-self: center;
}
.rc-after-primeiro {
  z-index: 2;
}
.rc-after-segundo {
  z-index: 1;
}
.rc-voltar {
  position: fixed;
  z-index: 31;
  top: 15px;
  left: 15px;
  border: 1px solid white;
  border-radius: 20px;
  background: rgba(20, 12, 6, 0.7);
  color: white;
  padding: 8px 14px;
}
/* Pix do After — só a área do botão marrom desenhado na própria imagem.
   A posição (px) é calculada em JS a partir da imagem renderizada. */
.rc-pix-area {
  position: absolute;
  z-index: 40;
  display: block;
  background: transparent;
  border: 0;
  cursor: pointer;
  pointer-events: auto !important;
}

/* ── Modal Pix dos presentes ──────────────────────────────────────────── */
.rc-pix-modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(5px);
}
.rc-pix-modal.rc-mostrar {
  display: flex;
}
.rc-pix-card {
  width: min(92vw, 520px);
  max-height: 88vh;
  overflow: auto;
  border: 1px solid rgba(190, 133, 52, 0.65);
  border-radius: 20px;
  background: linear-gradient(145deg, #fff8ed, #f3dfc2);
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.45);
  padding: 24px;
  text-align: center;
  color: #5a3514;
}
.rc-pix-card h3 {
  margin: 0 0 7px;
  font-family: Georgia, serif;
  font-size: 25px;
  font-weight: bold;
  letter-spacing: 0.04em;
}
.rc-pix-nome {
  font-weight: 700;
  font-size: 17px;
  margin-bottom: 4px;
}
.rc-pix-valor {
  font-family: Georgia, serif;
  font-size: 27px;
  font-weight: 700;
  margin-bottom: 16px;
}
.rc-pix-card textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 125px;
  resize: none;
  border: 1px solid #c99b63;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  padding: 12px;
  color: #4d2c12;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.35;
}
.rc-pix-acoes {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 14px;
}
.rc-pix-acoes button {
  border: 0;
  border-radius: 10px;
  padding: 13px 20px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
}
.rc-pix-copiar {
  background: #8b541c;
  color: white;
}
.rc-pix-fechar {
  background: transparent;
  color: #6b451f;
  border: 1px solid #b9874f !important;
}
.rc-pix-status {
  min-height: 20px;
  margin-top: 9px;
  font-size: 13px;
  color: #7a4b1a;
}

/* ── Desktop: coluna de 520px centralizada (correções do original) ─────── */
@media (min-width: 700px) {
  .rc-capa-moldura,
  .rc-pagina {
    max-width: 520px;
  }
  .rc-pagina {
    margin: 0 auto;
  }
  .rc-after-slide img {
    max-width: 520px;
  }
  .rc-nav {
    transform: translateX(-50%);
  }
}
```

- [ ] **Step 2: Commit**

A checagem real do CSS acontece no `npm run build` (Task 4); aqui só confirme que o arquivo tem as classes listadas em *Produces*.

```bash
git add src/app/convite-replica/convite-replica.css
git commit -m "Port the interactive invitation styles with the rc- prefix

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Componente, página e layout

**Files:**
- Create: `src/app/convite-replica/convite-replica.tsx`
- Modify: `src/app/page.tsx` (substituir tudo)
- Modify: `src/app/layout.tsx` (remover `StarField`, `CurtainIntro`, `ChuvaBrilho`)

**Interfaces:**
- Consumes (de Task 1): `PIX_AFTER`, `PRESENTES`, `PRESENTES_TOPO`, `AREAS_MAPA`, `AREAS_INDICACOES`, `LUZES_ABERTURA`, `LUZES_DRESS`, tipos `AreaClicavel`, `Luz`.
- Consumes (de Task 2): classes `.rc-*` e modificadores.
- Produces: `export default function ConviteReplica(): JSX.Element` em `convite-replica.tsx`; `page.tsx` exporta `metadata` e `viewport`.

- [ ] **Step 1: Criar `src/app/convite-replica/convite-replica.tsx`**

```tsx
"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./convite-replica.css";
import {
  AREAS_INDICACOES,
  AREAS_MAPA,
  LUZES_ABERTURA,
  LUZES_DRESS,
  PIX_AFTER,
  PRESENTES,
  PRESENTES_TOPO,
  type AreaClicavel,
  type Luz,
} from "./dados";

const TOTAL_TELAS = 7;
const ALVO_CONTAGEM = new Date("2026-11-28T17:00:00-03:00").getTime();

/** Fases do After: as duas imagens ficam apagadas ("preparando" e "intervalo"),
    exceto quando a fase é a delas. */
type FaseAfter = "fechado" | "preparando" | "primeiro" | "intervalo" | "segundo";

function formatarContagem(agora: number | null) {
  let diff = agora === null ? 0 : Math.max(0, ALVO_CONTAGEM - agora);
  const dias = Math.floor(diff / 86400000);
  diff %= 86400000;
  const horas = Math.floor(diff / 3600000);
  diff %= 3600000;
  const minutos = Math.floor(diff / 60000);
  diff %= 60000;
  const segundos = Math.floor(diff / 1000);
  return [dias, horas, minutos, segundos].map((n) => String(n).padStart(2, "0"));
}

/** Copia texto; se a API de clipboard falhar, cai no execCommand como o original. */
async function copiarTexto(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const campo = document.createElement("textarea");
    campo.value = texto;
    document.body.appendChild(campo);
    campo.select();
    try {
      document.execCommand("copy");
    } catch {
      // sem permissão: o original também ignora
    }
    campo.remove();
  }
}

function Foto({
  src,
  alt,
  largura = 1024,
  altura = 1536,
  prioridade = false,
  imgRef,
  aoCarregar,
}: {
  src: string;
  alt: string;
  largura?: number;
  altura?: number;
  prioridade?: boolean;
  imgRef?: React.Ref<HTMLImageElement>;
  aoCarregar?: () => void;
}) {
  return (
    <Image
      ref={imgRef}
      src={src}
      alt={alt}
      width={largura}
      height={altura}
      unoptimized
      priority={prioridade}
      loading={prioridade ? undefined : "eager"}
      onLoad={aoCarregar}
    />
  );
}

function Area({ area }: { area: AreaClicavel }) {
  return (
    <a
      className="rc-area"
      aria-label={area.rotulo}
      href={area.href}
      target={area.alvo}
      rel={area.rel}
      style={{
        left: `${area.esq}%`,
        top: `${area.topo}%`,
        width: `${area.larg}%`,
        height: `${area.alt}%`,
        zIndex: area.z,
      }}
    />
  );
}

function Luzes({ luzes, classe }: { luzes: Luz[]; classe: string }) {
  return luzes.map((luz, i) => (
    <span
      key={i}
      aria-hidden="true"
      className={classe}
      style={{
        left: luz.esq === undefined ? undefined : `${luz.esq}%`,
        right: luz.dir === undefined ? undefined : `${luz.dir}%`,
        top: `${luz.topo}%`,
        animationDelay: `${luz.atraso}s`,
      }}
    />
  ));
}

export default function ConviteReplica() {
  const [aberto, setAberto] = useState(false);
  const [atual, setAtual] = useState(0);
  const [agora, setAgora] = useState<number | null>(null);
  const [fase, setFase] = useState<FaseAfter>("fechado");
  const [presente, setPresente] = useState<number | null>(null);
  const [statusPix, setStatusPix] = useState("");
  const [areaPix, setAreaPix] = useState<CSSProperties>({});
  const [after2Carregada, setAfter2Carregada] = useState(false);

  const telas = useRef<(HTMLElement | null)[]>([]);
  const imgAfter2 = useRef<HTMLImageElement | null>(null);
  const campoPix = useRef<HTMLTextAreaElement | null>(null);

  // Contagem regressiva ao vivo (1 tick imediato + 1 por segundo).
  useEffect(() => {
    const tick = () => setAgora(Date.now());
    const inicio = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(inicio);
      clearInterval(id);
    };
  }, []);

  // Ao entrar, o original rola para a primeira tela.
  useEffect(() => {
    if (aberto) telas.current[0]?.scrollIntoView({ behavior: "smooth" });
  }, [aberto]);

  // Sequência do After: pinta apagado → confirmada (5200ms) → preto (350ms) → After.
  useEffect(() => {
    if (fase === "preparando") {
      let segundoQuadro = 0;
      const primeiroQuadro = requestAnimationFrame(() => {
        segundoQuadro = requestAnimationFrame(() => setFase("primeiro"));
      });
      return () => {
        cancelAnimationFrame(primeiroQuadro);
        cancelAnimationFrame(segundoQuadro);
      };
    }
    if (fase === "primeiro") {
      const id = setTimeout(() => setFase("intervalo"), 5200);
      return () => clearTimeout(id);
    }
    if (fase === "intervalo") {
      const id = setTimeout(() => setFase("segundo"), 350);
      return () => clearTimeout(id);
    }
  }, [fase]);

  // Posiciona a área clicável do Pix do After sobre o botão marrom da imagem
  // (em px, a partir da imagem renderizada — igual ao original).
  const afterVisivel = fase !== "fechado";
  useEffect(() => {
    if (!afterVisivel) return;
    let quadro = 0;
    let atraso = 0;
    const posicionar = () => {
      const img = imgAfter2.current;
      if (!img) return;
      const r = img.getBoundingClientRect();
      setAreaPix({
        left: r.left + r.width * 0.595,
        top: r.top + r.height * 0.584,
        width: r.width * 0.22,
        height: r.height * 0.05,
      });
    };
    const agendar = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(posicionar);
    };
    const aoGirar = () => {
      clearTimeout(atraso);
      atraso = window.setTimeout(agendar, 100);
    };
    agendar();
    window.addEventListener("resize", agendar);
    window.addEventListener("orientationchange", aoGirar);
    return () => {
      cancelAnimationFrame(quadro);
      clearTimeout(atraso);
      window.removeEventListener("resize", agendar);
      window.removeEventListener("orientationchange", aoGirar);
    };
  }, [afterVisivel, after2Carregada]);

  // Esc fecha o modal Pix.
  useEffect(() => {
    if (presente === null) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPresente(null);
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [presente]);

  function ir(n: number) {
    const novo = Math.max(0, Math.min(TOTAL_TELAS - 1, n));
    setAtual(novo);
    telas.current[novo]?.scrollIntoView({ behavior: "smooth" });
  }

  async function copiarPresente(pix: string) {
    try {
      await navigator.clipboard.writeText(pix);
      setStatusPix("Pix Copia e Cola copiado. Agora é só colar no aplicativo do seu banco.");
    } catch {
      campoPix.current?.focus();
      campoPix.current?.select();
      try {
        document.execCommand("copy");
        setStatusPix("Pix Copia e Cola copiado.");
      } catch {
        setStatusPix("Selecione o código acima e copie manualmente.");
      }
    }
  }

  function abrirPresente(indice: number) {
    setPresente(indice);
    setStatusPix("");
    const pix = PRESENTES[indice].pix;
    setTimeout(() => copiarPresente(pix), 60);
  }

  const [dias, horas, minutos, segundos] = formatarContagem(agora);
  const dadosPresente = presente === null ? null : PRESENTES[presente];
  const classeSite = aberto ? " rc-visivel" : "";

  return (
    <div className="rc-raiz">
      {!aberto && (
        <div className="rc-capa">
          <div className="rc-capa-moldura">
            <Foto
              src="/convite/capa.jpg"
              alt="Laura e Gustavo — O Casamento"
              largura={864}
              altura={1536}
              prioridade
            />
            <svg className="rc-energia" viewBox="0 0 864 1536" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <path
                className="rc-nuvem"
                d="M165 650 C255 730 300 805 390 800 C485 795 535 690 625 665 C685 648 735 690 775 748"
              />
            </svg>
          </div>
          <button type="button" className="rc-entrar" onClick={() => setAberto(true)}>
            ENTRAR
          </button>
        </div>
      )}

      <div className={`rc-site${classeSite}`}>
        <section className="rc-pagina rc-abertura" ref={(el) => { telas.current[0] = el; }}>
          <Foto src="/convite/01-abertura.png" alt="Página 1" />
          <Luzes luzes={LUZES_ABERTURA} classe="rc-luz-abertura" />
        </section>

        <section className="rc-pagina" ref={(el) => { telas.current[1] = el; }}>
          <div className="rc-contagem" role="timer" aria-label="Contagem regressiva para o casamento">
            {[dias, horas, minutos, segundos].map((valor, i) => (
              <div className="rc-celula" key={i}>
                <span>{valor}</span>
              </div>
            ))}
          </div>
          <Foto src="/convite/02-contagem.jpg" alt="Página 2" />
        </section>

        <section className="rc-pagina" ref={(el) => { telas.current[2] = el; }}>
          {AREAS_MAPA.map((area) => (
            <Area key={area.rotulo} area={area} />
          ))}
          <Foto src="/convite/03-como-chegar.png" alt="Página 3" />
        </section>

        <section className="rc-pagina rc-dress" ref={(el) => { telas.current[3] = el; }}>
          <Luzes luzes={LUZES_DRESS} classe="rc-luz-dress" />
          <Foto src="/convite/04-dress-code.png" alt="Página 4" />
        </section>

        <section className="rc-pagina" ref={(el) => { telas.current[4] = el; }}>
          <Foto src="/convite/05-indicacoes.png" alt="Página 5" />
          {AREAS_INDICACOES.map((area) => (
            <Area key={area.rotulo} area={area} />
          ))}
        </section>

        <section className="rc-pagina" ref={(el) => { telas.current[5] = el; }}>
          {PRESENTES_TOPO.map((topo, i) => (
            <button
              key={i}
              type="button"
              className="rc-presente"
              aria-label={`Abrir Pix do presente ${i + 1}`}
              style={{ top: `${topo}%` }}
              onClick={() => abrirPresente(i)}
            />
          ))}
          <Foto src="/convite/06-presentes.png" alt="Página 6" />
        </section>

        <section className="rc-pagina" ref={(el) => { telas.current[6] = el; }}>
          <button
            type="button"
            className="rc-confirmar"
            aria-label="Confirmar presença"
            onClick={() => setFase("preparando")}
          />
          <Foto src="/convite/07-confirmar.png" alt="Página 7" />
        </section>
      </div>

      <div className={`rc-nav${classeSite}`}>
        <button type="button" aria-label="Tela anterior" onClick={() => ir(atual - 1)}>
          ‹
        </button>
        <span>
          {atual + 1} / {TOTAL_TELAS}
        </span>
        <button type="button" aria-label="Próxima tela" onClick={() => ir(atual + 1)}>
          ›
        </button>
      </div>

      <div className={`rc-after${afterVisivel ? " rc-visivel" : ""}`}>
        <button type="button" className="rc-voltar" onClick={() => setFase("fechado")}>
          ← Voltar
        </button>
        <div className={`rc-after-slide rc-after-primeiro${fase === "primeiro" ? " rc-ativo" : ""}`}>
          <Foto src="/convite/after-1-confirmada.png" alt="Sua presença está confirmada" />
        </div>
        <div className={`rc-after-slide rc-after-segundo${fase === "segundo" ? " rc-ativo" : ""}`}>
          <Foto
            src="/convite/after-2.jpg"
            alt="After"
            imgRef={imgAfter2}
            aoCarregar={() => setAfter2Carregada(true)}
          />
          <a
            className="rc-pix-area"
            aria-label="Copiar Pix do After"
            href="#"
            style={areaPix}
            onClick={(e) => {
              e.preventDefault();
              void copiarTexto(PIX_AFTER);
            }}
          />
        </div>
      </div>

      <div
        className={`rc-pix-modal${presente !== null ? " rc-mostrar" : ""}`}
        aria-hidden={presente === null}
        onClick={(e) => {
          if (e.target === e.currentTarget) setPresente(null);
        }}
      >
        <div className="rc-pix-card" role="dialog" aria-modal="true" aria-labelledby="rc-pix-titulo">
          <h3 id="rc-pix-titulo">PRESENTE SELECIONADO</h3>
          <div className="rc-pix-nome">{dadosPresente?.nome}</div>
          <div className="rc-pix-valor">{dadosPresente?.valor}</div>
          <textarea ref={campoPix} readOnly aria-label="Pix Copia e Cola" value={dadosPresente?.pix ?? ""} />
          <div className="rc-pix-acoes">
            <button
              type="button"
              className="rc-pix-copiar"
              onClick={() => dadosPresente && copiarPresente(dadosPresente.pix)}
            >
              COPIAR PIX
            </button>
            <button type="button" className="rc-pix-fechar" onClick={() => setPresente(null)}>
              FECHAR
            </button>
          </div>
          <div className="rc-pix-status">{statusPix}</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Substituir `src/app/page.tsx`**

```tsx
import type { Metadata, Viewport } from "next";
import ConviteReplica from "./convite-replica/convite-replica";

export const metadata: Metadata = {
  title: "Laura & Gustavo — O Casamento",
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function Home() {
  return <ConviteReplica />;
}
```

- [ ] **Step 3: Editar `src/app/layout.tsx`**

Remover as três importações (`StarField`, `ChuvaBrilho`, `CurtainIntro`) e as três linhas de uso. O `body` fica:

```tsx
      <body className="min-h-full flex flex-col font-sans">
        {children}
      </body>
```

(`/padrinhos` continua com o seu próprio `StarField` dentro de `convocacao.tsx`; `/admin` já ignorava os três.)

- [ ] **Step 4: tsc e lint**

Run: `npx tsc --noEmit`
Expected: sem saída (limpo). Se `viewportFit` não existir em `Viewport`, usar `export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" }`; se ainda assim o tipo não aceitar, remover o campo e registrar o desvio.

Run: `npm run lint`
Expected: `✖ 5 problems (3 errors, 2 warnings)` — exatamente a linha de base de `origin/main`; nenhum arquivo novo na lista. Qualquer problema em `src/app/convite-replica/**`, `page.tsx` ou `layout.tsx` deve ser corrigido sem `eslint-disable`.

- [ ] **Step 5: Commit**

```bash
git add src/app/convite-replica/convite-replica.tsx src/app/page.tsx src/app/layout.tsx
git commit -m "Replace the home with the interactive invitation replica

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Verificação contra a referência e build

**Files:**
- Create (fora do repositório, em `$EXTRAIDOS`): `ref/index.html`, `ref/img/*`, `montar-ref.mjs`
- Modify (se a comparação achar diferenças): arquivos das Tasks 1–3

**Interfaces:**
- Consumes: tudo das Tasks 1–3.
- Produces: relatório de diferenças (nenhuma esperada além das correções de desktop) e `npm run build` verde.

- [ ] **Step 1: Reconstruir o HTML de referência**

`$EXTRAIDOS/montar-ref.mjs`:

```js
import fs from "node:fs";
const base = "C:/Users/pedro/AppData/Local/Temp/claude/C--Users-pedro-Desktop-Eu-Projetos-casamentogulau/35af0ea7-babe-4f36-8b41-0d124d0d5562/scratchpad";
const ext = ["jpg", "png", "jpg", "png", "png", "png", "png", "png", "png", "jpg"];
fs.mkdirSync(`${base}/ref/img`, { recursive: true });
for (let i = 0; i < 10; i++) fs.copyFileSync(`${base}/htmlimgs/h${i}.${ext[i]}`, `${base}/ref/img/h${i}.${ext[i]}`);
let html = fs.readFileSync(`${base}/ref-stripped.html`, "utf8");
html = html.replace(/DATAURI_(\d+)\[[^\]]*\]/g, (_, n) => `img/h${n}.${ext[Number(n)]}`);
fs.writeFileSync(`${base}/ref/index.html`, html);
console.log("ref/index.html pronto");
```

Run: `node "$EXTRAIDOS/montar-ref.mjs"`, depois servir: `cd "$EXTRAIDOS/ref" && python -m http.server 4010` (em segundo plano). Referência em `http://localhost:4010/index.html`.

- [ ] **Step 2: Subir a réplica**

Run em segundo plano, no worktree: `npm run dev -- -p 3006`. Abrir `http://localhost:3006/` no navegador do app.

- [ ] **Step 3: Comparar tela por tela em 375×812**

Em cada página (referência e réplica), com `prefers-reduced-motion` neutralizado (`window.matchMedia` sobrescrito e recarga) para ver as animações, ou aceitando o modo reduzido nos dois lados:
1. Capa: screenshot (capa vertical, ENTRAR a 8% do fundo, névoa).
2. Clicar ENTRAR; para cada uma das 7 telas, rolar até ela (`scrollBehavior='auto'`) e tirar screenshot.
3. Contagem: ler os 4 números e comparar com o cálculo para `2026-11-28T17:00:00-03:00`.
4. Abrir cada presente (1–9): nome, valor e código no modal; "COPIAR PIX" e "FECHAR".
5. Clicar em Confirmar presença: confirmada → (5,2 s) → After; "← Voltar".

- [ ] **Step 4: Comparar numericamente as áreas clicáveis**

Rodar nas duas páginas (após ENTRAR), via `javascript_tool`:

```js
(() => {
  const sec = (el) => el.closest("section");
  const lista = [...document.querySelectorAll("section a[href], section button")].map((el) => {
    const r = el.getBoundingClientRect(), s = sec(el).getBoundingClientRect();
    return [
      el.getAttribute("aria-label"),
      +(((r.left - s.left) / s.width) * 100).toFixed(2),
      +(((r.top - s.top) / s.height) * 100).toFixed(2),
      +((r.width / s.width) * 100).toFixed(2),
      +((r.height / s.height) * 100).toFixed(2),
      el.getAttribute("href"),
    ];
  });
  return JSON.stringify(lista);
})()
```

Expected (375 px): as duas listas iguais (mesmos rótulos, % e hrefs).

- [ ] **Step 5: Desktop 1280×800**

Réplica: coluna de 520 px centralizada; rodar o mesmo script e confirmar os mesmos % do celular (as áreas acompanham a imagem); navegação centralizada; capa com a moldura de 520 px e a névoa alinhada; After com a área do Pix sobre o botão marrom.

- [ ] **Step 6: Corrigir diferenças**

Para cada diferença encontrada (além das correções de desktop previstas na spec), corrigir na fonte, repetir os passos 3–5 daquela tela e commitar com mensagem própria.

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: build concluído; rota `/` listada. Se o build falhar por variável de ambiente de `/admin` (sem `.env.local` neste worktree), registrar a causa e confirmar se a falha independe das mudanças desta branch.

- [ ] **Step 8: Encerrar**

Parar o servidor de dev (3006) e o `http.server` (4010). Garantir `git status` limpo e relatar ao Pedro: o que foi comparado, as diferenças intencionais (desktop) e o que ficou como no original (navegação fora do centro no celular, Pix do After sem aviso de "copiado", contador que só muda pelos botões).

---

## Registro da execução (desvios do plano)

- `next/image`: no Next 16 `priority` está obsoleta; a capa usa `preload`.
- `tsc` num worktree novo precisa de `npx next typegen` (o tipo global `LayoutProps` é gerado). `next typegen`, `next dev` e `next build` reescrevem `next-env.d.ts`; essa mudança não é commitada.
- Botões: o reset do Tailwind (padding 0, fonte herdada) mudava o tamanho dos botões em relação ao HTML. Corrigido com `font: revert` (padrão de cada plataforma), `line-height: normal` e `padding: 1px 6px` na navegação. Depois disso o ENTRAR, a navegação e o modal Pix ficaram idênticos ao original, medidos no navegador.
- After: no original os 5200 ms contam a partir do clique (e não do primeiro quadro de animação). A sequência foi reescrita com `afterAberto` + `ativo` para ter a mesma linha do tempo (acende em ~40 ms, apaga em ~5,2 s, After em ~5,56 s; diferença de até 10 ms para o original).
- A área clicável do Pix do After: no HTML original ela só é posicionada no carregamento (com o overlay oculto, onde a imagem tem tamanho 0) e em `resize`, então fica 0×0 até a janela mudar de tamanho. Aqui ela é posicionada ao abrir o After.
- Navegação "‹ n / 7 ›": no celular continua como no HTML (`left: 50%` sem centralizar, então fica deslocada para a direita); só a partir de 700 px ela é centralizada.
