# Réplica do convite: mescla do HTML novo (pix-6)

Data: 2026-10-05 · Branch: `worktree-convite-replica` · Continua os specs
`2026-10-03-convite-replica-design.md` e
`2026-10-03-convite-replica-checkin-design.md`. **Este documento substitui a
decisão "busca por contém" do spec de check-in**: a entrada passa a exigir o
nome completo, e a função `buscar-convite` muda.

## Origem

O Pedro enviou `convite_Laura_Gustavo_presentes_pix-6.html`. Comparado com a
referência anterior (pix-2), que o projeto replica: as 10 imagens são
idênticas byte a byte; presentes, valores, códigos Pix, telas, áreas
clicáveis, contagem e luzes não mudaram. As diferenças são:

1. Pix do After abre a janela Pix e, depois de copiar, mostra uma tela de
   comprovante com link para o WhatsApp (imagem nova).
2. Janela Pix dos presentes: não copia mais sozinha ao abrir; margem do valor
   16 → 10 px; CSS `.pix-receipt-note` (sem uso no HTML).
3. A primeira tela do After passa a ser clicável (pula para a segunda).
4. Entrada com "Nome completo" e lista fixa de 181 nomes no JavaScript,
   comparação exata (sem acento, sem maiúscula, espaços colapsados).
5. Confirmar presença envia e-mail via formsubmit.co.
6. Barra de navegação escondida; o HTML não tem chuva de estrelas.

## Decisões do Pedro (2026-10-05)

- **1:** igual ao HTML novo.
- **2:** os presentes **continuam copiando sozinhos ao abrir**; o resto entra
  como no HTML novo, inclusive o CSS sem uso.
- **3:** primeira tela do After clicável, **mantendo** a troca automática.
- **4:** formato novo de entrada (nome completo exato), mas a lista vai para o
  **Supabase**, não para dentro da página. Os 181 nomes entram **todos no 1º
  horário** (`cerimonia_festa_after`), **cada pessoa como um convite
  próprio**, **exatamente como estão no HTML** (sem corrigir grafias).
  Acento e maiúscula são **ignorados** na comparação.
- **Comparação exata no servidor (opção B):** a função `buscar-convite` passa a
  exigir o nome completo e grava check-in **só de quem entrou**. O Pedro
  publica a função; eu entrego o arquivo.
- **5:** a confirmação continua gravando no Supabase (os noivos acompanham pelo
  `/admin`). Sem formsubmit.
- **6:** sem chuva de estrelas; barra de navegação continua fora.

## Fora de escopo

- Corrigir grafias da lista (`Lucianaleiria`, `Juliana Kreuzbur`,
  `Jefferson Pereira (Gu)`, `Paiva` etc.). Ficam como estão; o convidado
  precisa digitar igual. Correções futuras são feitas no banco.
- Lista do 2º horário e a arte do 2º horário.
- Migração de banco: nenhuma tabela ou RPC muda. A RPC
  `buscar_convidados_por_nome` deixa de ser usada pela função, mas continua no
  banco.
- E-mail de confirmação (formsubmit) e registro do After pelo site.
- Proteção forte de imagens e Pix (continua sendo uma "porta de nome").

## Função `buscar-convite` (nova versão)

Arquivo: `supabase/functions/buscar-convite/index.ts`. Contrato de entrada e
saída igual ao atual: recebe `{ busca }`, devolve
`{ convite: { id, nome_exibicao, perfil, pessoas } }`.

1. Normaliza o texto: NFD sem diacríticos, minúsculas, espaços colapsados,
   pontas aparadas (a mesma regra de `normalizarNome` do admin).
2. Texto vazio depois de normalizado → **400** "Digite seu nome completo".
3. Lê `id, convite_id, nome` de todos os convidados (lista pequena; limite
   5000) e fica só com quem tem o nome normalizado **igual** ao texto.
4. Nenhum → **404** "Nome não encontrado na lista de convidados."
5. Iguais em mais de um convite → **409** "Há mais de um convidado com esse
   nome. Fale com os noivos." (não deve acontecer: a importação e o `/admin`
   impedem nomes iguais).
6. Carrega o convite e todas as pessoas do grupo, como hoje.
7. **Check-in:** grava `checkin_em` só nas pessoas cujo nome bateu e que ainda
   não tinham check-in. Falha ao gravar o check-in não bloqueia a resposta
   (como hoje).

Compatível com o site que está no ar: nome completo continua entrando; um
pedaço de nome passa a dar 404.

## `/admin` (rota `POST /api/admin/convites`)

Com a comparação exata, só nomes **iguais** (normalizados) causam ambiguidade.
A checagem "um nome contém o outro" vira "o nome já existe em outro grupo",
com mensagem "O nome "X" já existe no grupo "Y". Diferencie os nomes." A
remoção de duplicatas dentro do próprio pedido continua.

## Importação dos 181 nomes

- CSV gerado a partir da lista do HTML, **fora do repositório** (tem nomes de
  convidados): `grupo,nome_exibicao,nome,perfil`, uma linha por pessoa,
  `grupo` = posição na lista, `nome_exibicao` = o próprio nome,
  `perfil` = `cerimonia_festa_after`.
- `scripts/importar-convidados.mjs` ganha:
  - `--simular`: lê o banco, mostra o relatório e não grava nada;
  - checagem antes de gravar: nomes repetidos dentro do CSV e nomes que já
    existem no banco (normalizados). Havendo qualquer um, **para sem gravar**
    e lista os casos.
- Execução: primeiro `--simular`; a gravação real em produção só com o "ok"
  do Pedro na hora. Usa o `.env.local` do checkout principal (mesmas chaves do
  script atual).

## Site

### Entrada (capa)

- Campo: placeholder e `aria-label` "Nome completo", `autoComplete="name"`,
  valor lembrado no aparelho como hoje (`laura-gu:nome-checkin`).
- Visual e posições do HTML novo: ENTRAR em `bottom: 8%`; campo em
  `bottom: calc(8% + 62px)`, largura `min(78%, 360px)`, padding `13px 18px`,
  borda `1px rgba(255,255,255,.9)`, raio 28px, fundo `rgba(20,12,6,.45)`
  (`.58` com foco), texto branco centralizado, placeholder branco a 90%;
  mensagem em `bottom: calc(8% + 112px)`, largura `min(82%, 380px)`, 13px,
  altura de linha 1.35, branca com `text-shadow: 0 1px 4px #000`.
- **Desvio:** fonte do campo **16px** (o HTML usa 15px; abaixo de 16px o
  iPhone dá zoom ao focar).
- ENTRAR apagado (opacidade .55) e sem receber toque enquanto o campo está
  vazio, via CSS (`:placeholder-shown`), sem estado; também apagado durante a
  busca. **Desvio:** no HTML ele só acende quando o nome bate, porque a lista
  está na página; aqui a checagem acontece ao tocar.
- Digitar esconde a mensagem.
- Mensagens: 404 e nome que não bate → "Nome não encontrado na lista de
  convidados."; 400/409 → texto do servidor; rede ou outro erro → "Não foi
  possível verificar agora. Tente de novo.".
- **Defesa no site:** mesmo com resposta 200, só entra se alguma pessoa do
  grupo tiver o nome normalizado igual ao digitado. Assim o site já exige o
  nome completo mesmo antes da função nova ser publicada.

### Confirmar presença (tela 7)

- Grupo de **uma pessoa** (todos os 181): o toque grava direto
  `confirmarPresenca(id, { confirmou_festa: true, + confirmou_cerimonia: true
  se o perfil for cerimonia_festa_after })` e, gravado, abre o After. Toques
  repetidos durante o envio são ignorados.
- **Desvio:** se a gravação falhar, não abre o After e mostra um aviso
  ("Não conseguimos salvar sua confirmação. Tente de novo.") numa pílula
  escura fixa no pé da tela, que some sozinha em 5 s (o HTML abre o After
  mesmo com falha).
- Grupo de **duas ou mais pessoas** (criado pelo `/admin`): continua a janela
  de confirmação atual.

### After

- A primeira tela ("confirmada") recebe toque: pula para a segunda com o mesmo
  apagar + 350 ms de preto. A troca automática de 5,2 s continua; o que vier
  primeiro vale, sem repetir.
- A segunda tela ativa recebe toque (área do Pix).

### Pix do After e tela do comprovante

- Toque na área do Pix → abre a janela Pix com nome "After", valor
  "R$ 85,90" e o código do After; título continua "PRESENTE SELECIONADO";
  **não copia sozinho**.
- COPIAR PIX: copia (área de transferência; se falhar, seleciona o texto e
  usa `execCommand`). Copiou → "Pix Copia e Cola copiado. Agora é só colar no
  aplicativo do seu banco." e, **só no After**, 180 ms depois fecha a janela e
  abre a tela do comprovante. Não copiou → "Selecione o código acima e copie
  manualmente."
- Tela do comprovante: fundo `rgba(0,0,0,.82)` com desfoque, acima de tudo;
  imagem `public/convite/pix-copiado.png` (cópia idêntica da imagem do HTML,
  1,9 MB) com no máximo 96vw × 92vh, raio 12px; por cima, o link "ENVIE O
  COMPROVANTE AQUI" (`https://wa.me/5551998146645`, nova aba) na posição e no
  estilo do HTML (`left 12%`, `top 86%`, `width 76%`, `height 6%`).
- Fecha tocando fora da imagem ou com Esc. Esc fecha primeiro o comprovante;
  com ele fechado, fecha a janela Pix.
- A imagem do comprovante só começa a carregar quando o After abre (não pesa
  na entrada do site).

### Janela Pix dos presentes

- Continua copiando sozinha 60 ms depois de abrir.
- Mesmas mensagens de cópia do item acima; sem tela do comprovante.
- Margem abaixo do valor: 10px. CSS `.rc-pix-nota` (equivalente ao
  `.pix-receipt-note`) incluído sem uso, como no HTML.

### Estrelas e navegação

- Sai a chuva de estrelas do convite. O componente `chuva-brilho.tsx` e o CSS
  dele ficam no projeto, sem uso.
- Barra de navegação: continua fora.

## Arquivos

- `supabase/functions/buscar-convite/index.ts` — comparação exata e check-in
  individual.
- `src/app/api/admin/convites/route.ts` — checagem de nome igual.
- `scripts/importar-convidados.mjs` — `--simular` e checagem antes de gravar.
- `src/lib/supabase-functions.ts` — o erro lançado passa a carregar o status
  HTTP (para o site separar 404 de falha de rede).
- `src/app/convite-replica/capa-entrada.tsx` e `convite-replica.css` — nova
  entrada.
- `src/app/convite-replica/convite-replica.tsx` — confirmação direta, After
  clicável, Pix do After, tela do comprovante, sem estrelas.
- `src/app/convite-replica/dados.ts` e `versoes.ts` — valor "R$ 85,90" e link
  do WhatsApp do comprovante.
- `public/convite/pix-copiado.png` — imagem nova.

## Ordem em produção

1. O Pedro publica a nova `buscar-convite` no painel do Supabase.
2. Importação: `--simular`, depois gravação com o "ok" do Pedro.
3. PR do site, mesclado quando o Pedro quiser. A defesa no site garante o nome
   completo mesmo se a ordem for outra.

## Verificação

1. `npx tsc --noEmit`, `npm run lint` (só os 5 problemas que já existem) e
   `npm run build`.
2. Função: a lógica de normalização e comparação conferida com casos de
   teste locais (acento, maiúscula, espaços extras, pedaço de nome, nome
   inexistente, nome repetido em dois convites).
3. Servidor falso das funções com a regra nova. No navegador (375 px e
   1280 px): campo vazio (ENTRAR apagado), pedaço de nome, nome errado, nome
   sem acento, falha de rede; confirmação direta (sucesso e falha) e grupo de
   três (janela); toque na primeira tela do After e troca automática; janela
   do Pix do After, cópia, tela do comprovante, link do WhatsApp, ordem do Esc
   e toque fora; presentes ainda copiando sozinhos; sem estrelas.
4. Importação: `--simular` contra o banco real antes de gravar.
5. Teste com o backend real fica para depois da função publicada e do preview
   do Vercel.

## Entrega

Commits na branch `worktree-convite-replica`. O arquivo da função é enviado
ao Pedro para publicar. Nada é publicado, implantado ou gravado em produção
sem o "ok" dele.
