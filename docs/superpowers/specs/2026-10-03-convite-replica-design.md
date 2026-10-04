# Réplica do convite interativo (HTML de referência)

Data: 2026-10-03 · Branch: `worktree-convite-replica` (a partir de `origin/main`)

## Objetivo

A home `/` desta branch passa a ser uma réplica fiel do convite interativo que o
casal enviou: `convite_Laura_Gustavo_presentes_pix-2.html` (conteúdo) e
`convite_casamento_interativo_final.pdf` (layout e ordem das telas).

Onde os dois divergem, **vale o HTML** (decisão do Pedro em 2026-10-03):
Bronze/Make/Hair com links reais, presentes com valor e Pix, After de R$ 85,90
com Pix copia-e-cola, tela "Sua presença está confirmada", capa vertical e
contagem regressiva ao vivo. O PDF só orienta layout e ordem.

## Fora de escopo

- Nenhum backend: "Confirmar presença" só abre a sequência confirmada → After,
  como no HTML. Não grava nada nem usa check-in / lista de convidados.
- `/admin`, `/padrinhos`, `src/app/api` e `supabase/` não mudam.
- Os componentes do site creme-dourado (hero, historia, busca-convite etc.)
  continuam no repositório, só deixam de ser usados pela home.

## Telas (ordem do HTML)

| # | Tela | Imagem | Sobreposições |
|---|------|--------|---------------|
| capa | L&G · O Casamento | `capa.jpg` (864×1536) | botão ENTRAR, névoa dourada (SVG animado) |
| 1 | Abertura "Depois de 9 anos…" | `01-abertura.png` | 8 luzes pulsantes |
| 2 | Contagem regressiva + data/hora/local | `02-contagem.jpg` | 4 números ao vivo sobre as caixas vazias |
| 3 | Como chegar | `03-como-chegar.png` | links Google Maps e Waze |
| 4 | Dress Code | `04-dress-code.png` | 8 luzes pulsantes |
| 5 | Indicações de Bronze, Make e Hair | `05-indicacoes.png` | Instagram e WhatsApp de 4 profissionais |
| 6 | Lista de presentes | `06-presentes.png` | 9 áreas → modal Pix (copia ao abrir) |
| 7 | Confirme sua presença | `07-confirmar.png` | botão → overlay do After |
| after-1 | Sua presença está confirmada | `after-1-confirmada.png` | fade-in, some após 5,2 s |
| after-2 | After | `after-2.jpg` | área do botão Pix (R$ 85,90) copia o código; "← Voltar" |

Navegação fixa `‹ n / 7 ›` com `scrollIntoView` suave. O contador só muda pelos
botões (comportamento do HTML, mantido de propósito).

## Arquitetura

- `src/app/page.tsx`: server component, renderiza `<ConviteReplica />`.
- `src/app/convite-replica/convite-replica.tsx`: componente cliente, com a
  máquina de estados (capa → site → After), contagem, modal Pix e posição do
  botão do After.
- `src/app/convite-replica/convite-replica.css`: CSS portado do HTML com
  prefixo `.rc-` (o Tailwind do resto do site não interfere). Animações,
  tempos, cores e `prefers-reduced-motion` iguais ao original.
- `src/app/convite-replica/dados.ts`: Pix do After, os 9 presentes (nome,
  valor, Pix copia-e-cola), links dos profissionais e do mapa — copiados
  literalmente do HTML.
- `public/convite/*`: as 10 imagens do HTML, byte a byte. Renderizadas com
  `next/image` + `unoptimized` e `width`/`height` reais (sem recompressão,
  sem salto de layout).
- `src/app/layout.tsx`: remove `StarField`, `CurtainIntro` e `ChuvaBrilho` do
  layout raiz — `/admin` e `/padrinhos` já os ignoravam, então só a home os
  usava. Os arquivos dos componentes ficam.
- Fundo `#120d09` da página via `html:has(.rc-raiz)` e `body:has(.rc-raiz)`
  (o resto do site usa creme).

Cada tela é um `<section>` com largura da própria imagem; as áreas clicáveis
são posicionadas em % **dessa** seção (no HTML original elas usam % da largura
da janela).

## Celular × desktop

Celular: idêntico ao HTML (imagens a 100% da largura, empilhadas, capa em
tela cheia).

A partir de 700 px o HTML original tem três defeitos (pelo CSS): imagem
colada à esquerda, áreas clicáveis desalinhadas e barra de navegação fora do
centro. Aqui: coluna de 520 px centralizada, áreas alinhadas à imagem e barra
centralizada com `translateX(-50%)`.

## Verificação

1. Reconstruir o HTML de referência (imagens extraídas ao lado) e abrir no
   navegador do app.
2. Comparar lado a lado, tela por tela, em 375×812 e 1280×800: capa, as 7
   telas, modal Pix, overlay confirmada → After.
3. Testar os cliques: Maps, Waze, Instagram/WhatsApp, 9 presentes, Confirmar,
   Pix do After, Voltar, ‹ ›.
4. `npx tsc --noEmit`, `npm run lint` (sem novos problemas além dos que já
   existem em `origin/main`) e `npm run build`.

## Entrega

Commit na branch `worktree-convite-replica`. PR só quando o Pedro pedir. Nada
é publicado nem implantado por conta própria.
