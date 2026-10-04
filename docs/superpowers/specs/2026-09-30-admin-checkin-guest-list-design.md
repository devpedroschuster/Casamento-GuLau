# Painel de admin: cadastro de convidados + status de check-in/confirmação

## Contexto

O site já tem um fluxo público de check-in e confirmação de presença
(`src/app/busca-convite.tsx`), apoiado em duas tabelas no Supabase:

- `convites`: um grupo convidado (ex: um casal ou uma família), com um
  campo `perfil` que já distingue as duas listas que os noivos usam:
  - `cerimonia_festa_after`: vê informações de cerimônia, jantar e festa/after.
  - `festa_after`: vê só informações de festa/after.
- `convidados`: cada pessoa dentro de um grupo, com confirmação de presença
  individual por etapa (`confirmou_cerimonia`, `confirmou_festa`,
  `confirmou_after`) e status de pagamento do after.

Essas tabelas têm RLS ligada sem policies — hoje só são acessadas via duas
Edge Functions (`buscar-convite`, `confirmar-presenca`) usando a service
role key. Não existe hoje nenhuma forma de inserir convidados fora do
Supabase diretamente, nem visualização de quem já fez check-in.

O site já está em produção (branch `main`) com convidados reais. Qualquer
mudança de schema precisa ser aditiva e não pode quebrar o fluxo público
existente.

## Objetivo

1. Dar aos noivos um jeito de cadastrar grupos/pessoas na lista (liberando
   quem pode fazer check-in), sem mexer direto no Supabase.
2. Dar aos noivos uma visão de quem já fez check-in e quem já confirmou
   presença (e em quais etapas).
3. Suportar as duas listas (`cerimonia_festa_after` e `festa_after`), que já
   existem no modelo de dados.

## Fora de escopo

- Autenticação/senha no `/admin` — decisão explícita do cliente: proteção é
  só a URL não ser divulgada/linkada (hidden route), sem login.
- Editar ou remover um convidado já cadastrado pelo painel — por ora isso é
  feito direto no Supabase, se necessário. O painel só insere e visualiza.
- Qualquer mudança no fluxo de confirmação de presença em si — ele já
  funciona e não muda.

## Modelo de dados

Uma migração aditiva, sem dropar nada:

```sql
alter table convidados add column checkin_em timestamptz;
```

### Por que o check-in é por pessoa, não por grupo

A busca de convite funciona por "contém" no nome e pode achar mais de uma
pessoa com nome parecido dentro do mesmo grupo (ex: duas pessoas de
sobrenome comum, como "Silva", no mesmo convite). Se o check-in fosse
gravado só no `convite` (grupo), o painel não conseguiria mostrar com
clareza qual pessoa específica efetivamente apareceu — o que fica
particularmente confuso quando sobrenomes comuns aparecem em mais de um
grupo diferente.

Por isso `checkin_em` fica na tabela `convidados` (por pessoa). Mas, como a
busca ainda resolve por grupo, a regra de gravação é: **quando a busca
resolve com sucesso para um único convite, todas as pessoas daquele grupo
recebem `checkin_em = now()` de uma vez** (só quem ainda estiver `null` —
não sobrescreve quem já tinha feito check-in antes). Isso cobre o caso de
"Pedro Schuster e Aléxia Chaves" cadastrados juntos: quando qualquer um dos
dois faz a busca, os dois já aparecem como check-in feito, mas a
confirmação de presença de cada um continua sendo respondida
separadamente, como já é hoje.

A ambiguidade entre convidados de **grupos diferentes** com nome parecido
já é tratada pelo código existente (`buscar-convite` retorna erro 409
"encontramos mais de uma pessoa, digite o nome completo" quando o termo
buscado bate com mais de um `convite_id` distinto) — isso não muda.

## Mudança na Edge Function `buscar-convite`

Depois de montar a resposta normal (convite + lista de pessoas), antes de
devolver a resposta:

```ts
const idsParaCheckin = pessoas.filter(p => !p.checkin_em).map(p => p.id);
if (idsParaCheckin.length > 0) {
  await supabase
    .from("convidados")
    .update({ checkin_em: new Date().toISOString() })
    .in("id", idsParaCheckin);
}
```

Se esse update falhar, o erro é apenas logado (`console.error`) — **não
pode travar nem retornar erro para o convidado**, já que o check-in é
secundário em relação ao convidado conseguir ver as informações do próprio
convite. A resposta devolvida ao client já reflete `checkin_em` atualizado
(seja atualizando o objeto em memória antes de responder, seja refazendo o
select).

`src/lib/supabase-functions.ts` ganha o campo `checkin_em: string | null`
no tipo `Pessoa`, só para tipagem (o client público não precisa exibir
isso em lugar nenhum).

## Backend do admin

Em vez de outra Edge Function, o admin usa Route Handlers do próprio
Next.js, porque:

- A service role key já está disponível no ambiente do servidor Next.js
  (`SUPABASE_SERVICE_ROLE_KEY`, sem prefixo `NEXT_PUBLIC_`) — não precisa
  de outro deploy separado via Supabase CLI/MCP.
- É mais simples iterar localmente (sem precisar reimplantar uma Edge
  Function a cada ajuste).

Novo arquivo `src/lib/supabase-admin.ts` (nunca importado por nenhum
componente client — só por Route Handlers do App Router, que rodam no
servidor):

- `criarClienteAdmin()` — cria o client Supabase com a service role key.
- `listarConvitesAdmin()` — retorna todos os `convites`, cada um com sua
  lista de `convidados` (incluindo `checkin_em` e as confirmações),
  ordenados por `criado_em desc`.
- `criarConviteAdmin({ nome_exibicao, perfil, nomes })` — insere 1 linha em
  `convites` e N linhas em `convidados` (uma por nome em `nomes`).

Novo arquivo `src/app/api/admin/convites/route.ts`:

- `GET`: chama `listarConvitesAdmin()`, devolve a lista em JSON.
- `POST`: valida o corpo (`nome_exibicao` não vazio, `perfil` é um dos dois
  valores válidos, `nomes` é uma lista com pelo menos 1 nome não vazio
  depois de `trim()`), chama `criarConviteAdmin(...)`, devolve o convite
  criado ou um erro 400/500 com mensagem em português — no mesmo estilo
  das Edge Functions existentes (`{ error: "..." }`).

## Página `/admin`

`src/app/admin/page.tsx` — Server Component (só para poder exportar
`metadata`, já que `export const metadata` não é permitido num arquivo
`"use client"`), sem nenhum link apontando para ela em nav/footer:

```ts
export const metadata = { robots: { index: false, follow: false } };
```

Esse `page.tsx` só renderiza um novo Client Component,
`src/app/admin/admin-painel.tsx`, que concentra toda a interatividade
(formulário, busca de dados, estado) — consistente com o resto do app, que
já é majoritariamente client-driven.

Conteúdo do `AdminPainel`:

1. **Formulário de cadastro**: campo de texto para o nome do grupo (ex:
   "Pedro Schuster e Aléxia Chaves"), seletor da lista (as duas opções de
   `perfil`, com rótulos em português tipo "Cerimônia + Jantar + Festa" e
   "Só Festa/After"), e uma lista dinâmica de nomes de pessoas (campo com
   botão "+ adicionar pessoa", mínimo 1). Ao enviar, faz `POST
   /api/admin/convites`; em caso de sucesso, limpa o formulário e atualiza
   a lista; em caso de erro, mostra a mensagem retornada pela API.
2. **Lista de grupos cadastrados**: busca via `GET /api/admin/convites` ao
   carregar a página. Para cada grupo, mostra o nome de exibição e a lista
   (perfil), e para cada pessoa dentro dele: nome, selo de check-in ("Fez
   check-in em 30/09 às 19:32" ou "Ainda não" — com data e hora, já que o
   check-in é feito pelo site e pode acontecer dias antes do evento, não
   só no dia), e o status de confirmação de cada
   etapa aplicável ao perfil do grupo (✓/✗/— conforme `confirmou_*` seja
   `true`/`false`/`null`), mais o status de pagamento do after quando
   aplicável.

Sem paginação nem busca/filtro nessa primeira versão — a lista de
convidados de um casamento é pequena o bastante para rolar a página.

## Erros

- Formulário: validação no client antes de enviar (campos vazios) +
  validação no servidor como segunda camada (nunca confiar só no client).
- Falha ao gravar `checkin_em`: não bloqueia o check-in do convidado (ver
  seção da Edge Function acima).
- Falha ao carregar a lista do admin: mensagem de erro inline na página
  com um botão para tentar de novo, sem quebrar a página toda.

## Testes / verificação

Não há suíte de testes automatizados no projeto. Verificação será:

1. `npx tsc --noEmit` e `npm run lint` limpos (sem novos erros além dos já
   conhecidos e pré-existentes).
2. Teste manual no preview: aplicar a migração, cadastrar um grupo de
   teste com 2 pessoas pelo `/admin`, fazer o check-in de uma delas pelo
   fluxo público digitando o nome, recarregar `/admin` e confirmar que
   **as duas** pessoas do grupo aparecem com check-in feito, confirmar
   presença de uma delas pelo fluxo público e conferir que o `/admin`
   reflete a confirmação individualmente.
3. Confirmar que o fluxo público de busca/confirmação continua funcionando
   normalmente para convidados já existentes (não regressão).

## Observação sobre produção

A migração e a mudança na Edge Function `buscar-convite` serão aplicadas
no mesmo projeto Supabase que já serve o site em produção (`main`). A
migração é puramente aditiva (uma coluna nova e opcional) e a mudança na
Edge Function não altera nenhum comportamento visível para o convidado —
é segura para aplicar mesmo com convidados reais já cadastrados. Ainda
assim, isso só será aplicado depois da aprovação deste documento.
