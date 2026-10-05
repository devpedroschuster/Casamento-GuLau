# Réplica do convite: mescla do HTML novo (pix-6) — Plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trazer para a réplica as mudanças do HTML pix-6 (Pix do After com tela de comprovante, After clicável, entrada por nome completo, confirmação direta, sem estrelas), com a lista de 181 convidados do 1º horário no Supabase e check-in só de quem entra.

**Architecture:** As regras do nome (normalizar, comparar, achar repetidos) ficam num módulo puro (`src/lib/nome-convidado.ts`) usado pelo site, pelo `/admin` e pelo script de importação; a Edge Function `buscar-convite` tem uma cópia da normalização (é publicada como arquivo único) e passa a exigir o nome igual. O site muda só em `convite-replica/` (capa, confirmação, After, Pix, comprovante). A importação usa o script que já existe, com modo de simulação e checagem antes de gravar.

**Tech Stack:** Next.js 16.3, React 19, TypeScript, CSS puro (`convite-replica.css`), Supabase (Edge Functions em Deno, `@supabase/supabase-js`), Node 24 (`node --test`, importa `.ts` direto), Deno 2.9 (roda a função localmente para teste).

**Spec:** `docs/superpowers/specs/2026-10-05-convite-pix6-design.md`

## Global Constraints

- Só o 1º horário: os 181 nomes entram com `perfil` `cerimonia_festa_after`, um convite por pessoa, nomes exatamente como no HTML. `VERSAO_SEGUNDO_HORARIO` continua igual à do 1º.
- Comparação do nome: NFD sem diacríticos, minúsculas, espaços colapsados, pontas aparadas; igualdade do nome inteiro.
- Textos exatos: placeholder e `aria-label` "Nome completo"; "Nome não encontrado na lista de convidados."; "Digite seu nome completo"; "Há mais de um convidado com esse nome. Fale com os noivos."; "Não foi possível verificar agora. Tente de novo."; "Não conseguimos salvar sua confirmação. Tente de novo."; "Pix Copia e Cola copiado. Agora é só colar no aplicativo do seu banco."; "Selecione o código acima e copie manualmente."; "ENVIE O COMPROVANTE AQUI"; `https://wa.me/5551998146645`; "After"; "R$ 85,90"; "PRESENTE SELECIONADO".
- Tempos: cópia automática dos presentes 60 ms; troca automática do After 5200 ms; preto entre telas 350 ms; troca janela → comprovante 180 ms; aviso de falha some em 5 s.
- Nada é gravado, publicado ou implantado em produção sem o "ok" do Pedro na hora. A função é entregue ao Pedro, não publicada por mim. O CSV com os nomes fica fora do repositório.
- Lint: no máximo os 5 problemas que já existem (3 erros, 2 avisos). `tsc` limpo (`npx next typegen` antes). `next-env.d.ts` não é commitado.
- Mensagens de commit terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

Pasta de trabalho fora do repositório (usada abaixo como `$S`):
`C:/Users/pedro/AppData/Local/Temp/claude/C--Users-pedro-Desktop-Eu-Projetos-casamentogulau/35af0ea7-babe-4f36-8b41-0d124d0d5562/scratchpad`
Lá já estão `convidados-pix6.json` (os 181 nomes, extraídos do HTML) e `pix6-imagens/p10.png` (imagem do comprovante, 1024×1536).

---

### Task 1: Regras do nome num módulo compartilhado

**Files:**
- Create: `src/lib/nome-convidado.ts`
- Create: `src/lib/nome-convidado.test.mjs`
- Modify: `package.json` (script `test`)

**Interfaces:**
- Produces: `normalizarNome(texto: string): string`; `mesmoNome(a: string, b: string): boolean`; `type NomeExistente = { nome: string; grupo: string }`; `nomesJaExistentes(novos: string[], existentes: NomeExistente[]): { nome: string; existente: NomeExistente }[]`; `nomesRepetidos(nomes: string[]): string[]`.

- [ ] **Step 1: Escrever o teste**

`src/lib/nome-convidado.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { mesmoNome, nomesJaExistentes, nomesRepetidos, normalizarNome } from "./nome-convidado.ts";

test("normalizarNome tira acento, maiúscula e espaços extras", () => {
  assert.equal(normalizarNome("  João   Luiz da Silva ARAGÃO "), "joao luiz da silva aragao");
  assert.equal(normalizarNome("Mariângela\tOliveira"), "mariangela oliveira");
});

test("mesmoNome exige o nome inteiro", () => {
  assert.ok(mesmoNome("joao luiz da silva aragao", "João Luiz da Silva Aragão"));
  assert.ok(mesmoNome("Jefferson Pereira (Gu)", "jefferson pereira (gu)"));
  assert.ok(!mesmoNome("João Luiz", "João Luiz da Silva Aragão"));
  assert.ok(!mesmoNome("Aragão", "João Luiz da Silva Aragão"));
  assert.ok(!mesmoNome("", ""));
  assert.ok(!mesmoNome("   ", " "));
});

test("nomesJaExistentes acha só nomes iguais", () => {
  const existentes = [
    { nome: "Ana Paula Alves", grupo: "Ana" },
    { nome: "Bruno Lima", grupo: "Bruno" },
  ];
  assert.deepEqual(nomesJaExistentes(["ana paula ALVES", "Ana Paula", "Carla"], existentes), [
    { nome: "ana paula ALVES", existente: existentes[0] },
  ]);
});

test("nomesRepetidos lista cada nome repetido uma vez", () => {
  assert.deepEqual(nomesRepetidos(["Ana", "Bruno", "ána", "ANA", "Carla"]), ["Ana"]);
  assert.deepEqual(nomesRepetidos(["Ana", "Bruno"]), []);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test src/lib/nome-convidado.test.mjs`
Expected: FAIL com `ERR_MODULE_NOT_FOUND` (`nome-convidado.ts` não existe).

- [ ] **Step 3: Implementar**

`src/lib/nome-convidado.ts`:

```ts
// Regras do nome que o convidado digita na capa. A Edge Function
// buscar-convite tem uma cópia de normalizarNome (ela é publicada como um
// arquivo só): se mudar aqui, mude lá também.

/** Sem acento, minúsculo, espaços colapsados e sem espaços nas pontas. */
export function normalizarNome(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Mesmo nome inteiro, ignorando acento, maiúscula e espaços extras. */
export function mesmoNome(a: string, b: string): boolean {
  const normalizado = normalizarNome(a);
  return normalizado.length > 0 && normalizado === normalizarNome(b);
}

export type NomeExistente = { nome: string; grupo: string };

/** Nomes novos que já existem na lista (mesmo nome normalizado). */
export function nomesJaExistentes(novos: string[], existentes: NomeExistente[]) {
  const porNome = new Map(existentes.map((e) => [normalizarNome(e.nome), e]));
  return novos.flatMap((nome) => {
    const existente = porNome.get(normalizarNome(nome));
    return existente ? [{ nome, existente }] : [];
  });
}

/** Nomes que aparecem mais de uma vez (normalizados), cada um listado uma vez
    com a grafia da primeira aparição. */
export function nomesRepetidos(nomes: string[]): string[] {
  const vistos = new Map<string, { nome: string; vezes: number }>();
  for (const nome of nomes) {
    const chave = normalizarNome(nome);
    const atual = vistos.get(chave);
    if (atual) atual.vezes++;
    else vistos.set(chave, { nome, vezes: 1 });
  }
  return [...vistos.values()].filter((v) => v.vezes > 1).map((v) => v.nome);
}
```

`package.json`, em `scripts`, depois de `"lint"`:

```json
    "test": "node --test src/**/*.test.mjs",
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: 4 testes `ok`, 0 falhas. (Um aviso do Node sobre `package.json` sem `"type"` ou sobre type stripping é aceitável; não pode haver erro.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/nome-convidado.ts src/lib/nome-convidado.test.mjs package.json
git commit -m "Share the guest name rules between the site, admin and import"
```

---

### Task 2: `buscar-convite` exige o nome inteiro e faz check-in só de quem entrou

**Files:**
- Modify: `supabase/functions/buscar-convite/index.ts` (substituir tudo)
- Test (fora do repositório): `$S/testar-buscar-convite.ts`

**Interfaces:**
- Consumes: a regra de `normalizarNome` (Task 1), copiada.
- Produces: contrato igual ao atual (`{ busca }` → `{ convite: { id, nome_exibicao, perfil, pessoas } }`), com 400 "Digite seu nome completo", 404 "Nome não encontrado na lista de convidados.", 409 "Há mais de um convidado com esse nome. Fale com os noivos.".

- [ ] **Step 1: Escrever o teste (roda a função de verdade em Deno contra um banco falso)**

`$S/testar-buscar-convite.ts`:

```ts
// Roda supabase/functions/buscar-convite/index.ts como processo (Deno.serve na
// porta 8000) apontando para um PostgREST falso na 54321 e confere as respostas.
const FUNCAO =
  "C:/Users/pedro/Desktop/Eu/Projetos/casamentogulau/.claude/worktrees/convite-replica/supabase/functions/buscar-convite/index.ts";

type Linha = Record<string, unknown>;
const pessoa = (id: string, convite_id: string, nome: string): Linha => ({
  id, convite_id, nome, checkin_em: null, confirmou_cerimonia: null, confirmou_festa: null,
  confirmou_after: null, status_pagamento_after: "nao_aplicavel", valor_after: null, respondido_em: null,
});
const convites: Linha[] = [
  { id: "c1", nome_exibicao: "João Luiz da Silva Aragão", perfil: "cerimonia_festa_after" },
  { id: "c2", nome_exibicao: "Família Rocha", perfil: "cerimonia_festa_after" },
  { id: "c3", nome_exibicao: "Ana Paula Alves", perfil: "festa_after" },
  { id: "c4", nome_exibicao: "Ana Paula Alves (outra)", perfil: "festa_after" },
];
const convidados: Linha[] = [
  pessoa("p1", "c1", "João Luiz da Silva Aragão"),
  pessoa("p2", "c2", "Diego Rocha"),
  pessoa("p3", "c2", "Elisa Rocha"),
  pessoa("p4", "c3", "Ana Paula Alves"),
  pessoa("p5", "c4", "Ana Paula Alves"),
];
const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

let checkins: string[] = [];
function filtrar(linhas: Linha[], params: URLSearchParams) {
  let r = linhas;
  for (const [k, v] of params) {
    if (["select", "limit", "order", "offset"].includes(k)) continue;
    if (v.startsWith("eq.")) r = r.filter((l) => String(l[k]) === v.slice(3));
    else if (v.startsWith("in.(")) {
      const ids = v.slice(4, -1).split(",").map((s) => s.replace(/^"|"$/g, ""));
      r = r.filter((l) => ids.includes(String(l[k])));
    } else throw new Error(`filtro não suportado: ${k}=${v}`);
  }
  return r;
}
const projetar = (linhas: Linha[], select: string | null) =>
  !select || select === "*"
    ? linhas
    : linhas.map((l) => Object.fromEntries(select.split(",").map((c) => [c, l[c]])));

const banco = Deno.serve({ port: 54321, onListen() {} }, async (req) => {
  const url = new URL(req.url);
  // RPC usada pela versão ANTIGA da função (busca por "contém").
  if (url.pathname === "/rest/v1/rpc/buscar_convidados_por_nome") {
    const { termo } = await req.json();
    const ids = [...new Set(convidados.filter((c) => normalizar(String(c.nome)).includes(termo)).map((c) => c.convite_id))];
    return Response.json(ids.map((convite_id) => ({ convite_id })));
  }
  const tabela = url.pathname.replace("/rest/v1/", "");
  const alvo = filtrar(tabela === "convites" ? convites : convidados, url.searchParams);
  if (req.method === "GET") {
    let r = projetar(alvo, url.searchParams.get("select"));
    const ordem = url.searchParams.get("order");
    if (ordem) {
      const col = ordem.split(".")[0];
      r = [...r].sort((a, b) => String(a[col]).localeCompare(String(b[col])));
    }
    if ((req.headers.get("accept") ?? "").includes("vnd.pgrst.object")) {
      return r.length === 1 ? Response.json(r[0]) : Response.json({ message: "não é único" }, { status: 406 });
    }
    return Response.json(r);
  }
  if (req.method === "PATCH") {
    const mudanca = await req.json();
    for (const l of alvo) Object.assign(l, mudanca);
    if ("checkin_em" in mudanca) checkins.push(...alvo.map((l) => String(l.id)));
    return new Response(null, { status: 204 });
  }
  return Response.json({ message: "método não suportado" }, { status: 405 });
});

const funcao = new Deno.Command(Deno.execPath(), {
  args: ["run", "-A", FUNCAO],
  env: { SUPABASE_URL: "http://localhost:54321", SUPABASE_SERVICE_ROLE_KEY: "chave-falsa" },
  stdout: "null",
  stderr: "piped",
}).spawn();

async function esperarFuncao() {
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch("http://localhost:8000", { method: "OPTIONS" });
      await r.body?.cancel();
      if (r.ok) return;
    } catch { /* ainda subindo */ }
    await new Promise((ok) => setTimeout(ok, 500));
  }
  throw new Error("a função não subiu na porta 8000");
}

type Caso = { nome: string; busca: unknown; status: number; erro?: string; convite?: string; checkins?: string[] };
const casos: Caso[] = [
  { nome: "nome inteiro sem acento", busca: "joao luiz da silva aragao", status: 200, convite: "c1", checkins: ["p1"] },
  { nome: "acento, maiúscula e espaços extras (já tem check-in)", busca: "  JOÃO   Luiz da Silva Aragão ", status: 200, convite: "c1", checkins: [] },
  { nome: "pedaço do nome", busca: "João Luiz", status: 404, erro: "Nome não encontrado na lista de convidados." },
  { nome: "sobrenome sozinho", busca: "Rocha", status: 404, erro: "Nome não encontrado na lista de convidados." },
  { nome: "uma pessoa de um grupo de duas", busca: "Diego Rocha", status: 200, convite: "c2", checkins: ["p2"] },
  { nome: "mesma pessoa de novo", busca: "diego rocha", status: 200, convite: "c2", checkins: [] },
  { nome: "nome igual em dois convites", busca: "Ana Paula Alves", status: 409, erro: "Há mais de um convidado com esse nome. Fale com os noivos." },
  { nome: "só espaços", busca: "   ", status: 400, erro: "Digite seu nome completo" },
  { nome: "não é texto", busca: 123, status: 400, erro: "Digite seu nome completo" },
  { nome: "nome que não existe", busca: "Fulano de Tal", status: 404, erro: "Nome não encontrado na lista de convidados." },
];

let falhas = 0;
try {
  await esperarFuncao();
  for (const caso of casos) {
    checkins = [];
    const r = await fetch("http://localhost:8000", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ busca: caso.busca }),
    });
    const corpo = await r.json();
    const problemas: string[] = [];
    if (r.status !== caso.status) problemas.push(`status ${r.status}, esperado ${caso.status}`);
    if (caso.erro && corpo.error !== caso.erro) problemas.push(`erro "${corpo.error}", esperado "${caso.erro}"`);
    if (caso.convite && corpo.convite?.id !== caso.convite) problemas.push(`convite ${corpo.convite?.id}, esperado ${caso.convite}`);
    if (caso.checkins && JSON.stringify(checkins) !== JSON.stringify(caso.checkins)) {
      problemas.push(`check-in em ${JSON.stringify(checkins)}, esperado ${JSON.stringify(caso.checkins)}`);
    }
    if (problemas.length) falhas++;
    console.log(`${problemas.length ? "FALHOU" : "ok    "} ${caso.nome}${problemas.length ? " — " + problemas.join("; ") : ""}`);
  }
} finally {
  funcao.kill();
  await funcao.status;
  await banco.shutdown();
}
console.log(falhas ? `\n${falhas} caso(s) falharam` : "\ntodos os casos passaram");
Deno.exit(falhas ? 1 : 0);
```

- [ ] **Step 2: Rodar contra a função atual e ver falhar**

Antes: confirmar que as portas 8000 e 54321 estão livres (`Get-NetTCPConnection -LocalPort 8000,54321 -State Listen` sem resultado).

Run: `deno run -A "$S/testar-buscar-convite.ts"`
Expected: FALHOU em "pedaço do nome", "sobrenome sozinho" (a antiga acha por "contém"), "uma pessoa de um grupo de duas" (check-in em p2 e p3), "só espaços" e "não é texto" (mensagem antiga), "nome que não existe" (mensagem antiga). Sai com código 1.

- [ ] **Step 3: Implementar a nova função**

`supabase/functions/buscar-convite/index.ts` (substituir tudo):

```ts
// Edge Function: buscar-convite
// Recebe o nome digitado pelo convidado na capa do site e devolve o convite
// (grupo) da pessoa cujo nome completo é IGUAL ao digitado — sem diferenciar
// acento, maiúscula/minúscula e espaços extras. Pedaço de nome não entra.
//
// Check-in: grava checkin_em só na pessoa cujo nome bateu (quem de fato
// entrou), na primeira vez.
//
// É publicada como um arquivo só: normalizarNome é a mesma regra de
// src/lib/nome-convidado.ts — se mudar uma, mude a outra.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COLUNAS_PESSOA =
  "id, nome, checkin_em, confirmou_cerimonia, confirmou_festa, confirmou_after, status_pagamento_after, valor_after, respondido_em";

function normalizarNome(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function responder(corpo: unknown, status: number) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { busca } = await req.json();
    const nomeBuscado = typeof busca === "string" ? normalizarNome(busca) : "";

    if (!nomeBuscado) {
      return responder({ error: "Digite seu nome completo" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // A lista tem poucas centenas de pessoas (o Supabase devolve até 1000
    // linhas por consulta): lê todos os nomes e compara aqui, com a mesma
    // normalização do site.
    const { data: todos, error: listaError } = await supabase
      .from("convidados")
      .select("id, convite_id, nome")
      .limit(5000);

    if (listaError) {
      return responder({ error: "Erro ao buscar convidado" }, 500);
    }

    const quemBateu = (todos ?? []).filter((p) => normalizarNome(p.nome) === nomeBuscado);
    const conviteIds = [...new Set(quemBateu.map((p) => p.convite_id))];

    if (conviteIds.length === 0) {
      return responder({ error: "Nome não encontrado na lista de convidados." }, 404);
    }

    // Só acontece se o mesmo nome estiver em dois convites (a importação e o
    // /admin impedem isso).
    if (conviteIds.length > 1) {
      return responder({ error: "Há mais de um convidado com esse nome. Fale com os noivos." }, 409);
    }

    const conviteId = conviteIds[0];

    const { data: convite, error: conviteError } = await supabase
      .from("convites")
      .select("id, nome_exibicao, perfil")
      .eq("id", conviteId)
      .single();

    if (conviteError || !convite) {
      return responder({ error: "Convite não encontrado" }, 404);
    }

    const { data: pessoas, error: pessoasError } = await supabase
      .from("convidados")
      .select(COLUNAS_PESSOA)
      .eq("convite_id", conviteId)
      .order("nome");

    if (pessoasError) {
      return responder({ error: "Erro ao buscar convidados do grupo" }, 500);
    }

    // Check-in só de quem entrou: a pessoa cujo nome bateu, na primeira vez.
    // Nunca bloqueia a resposta ao convidado se a gravação falhar.
    const agora = new Date().toISOString();
    const idsQueEntraram = new Set(quemBateu.map((p) => p.id));
    const idsSemCheckin = pessoas
      .filter((p) => idsQueEntraram.has(p.id) && !p.checkin_em)
      .map((p) => p.id);

    if (idsSemCheckin.length > 0) {
      const { error: checkinError } = await supabase
        .from("convidados")
        .update({ checkin_em: agora })
        .in("id", idsSemCheckin);

      if (checkinError) {
        console.error("Erro ao gravar check-in:", checkinError.message);
      } else {
        for (const p of pessoas) {
          if (idsSemCheckin.includes(p.id)) p.checkin_em = agora;
        }
      }
    }

    return responder(
      {
        convite: {
          id: convite.id,
          nome_exibicao: convite.nome_exibicao,
          perfil: convite.perfil,
          pessoas,
        },
      },
      200
    );
  } catch (_err) {
    return responder({ error: "Erro inesperado" }, 500);
  }
});
```

- [ ] **Step 4: Rodar e ver passar**

Run: `deno run -A "$S/testar-buscar-convite.ts"`
Expected: 10 linhas `ok`, "todos os casos passaram", código 0.

Run também: `deno check supabase/functions/buscar-convite/index.ts`
Expected: sem erros de tipo.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/buscar-convite/index.ts
git commit -m "Match the full guest name and check in only who entered"
```

---

### Task 3: `/admin` barra só nomes iguais

**Files:**
- Modify: `src/app/api/admin/convites/route.ts:2-7` (imports) e `:84-107` (checagem)
- Modify: `src/lib/supabase-admin.ts:30-39` (remover `normalizarNome`, agora em `nome-convidado.ts`)

**Interfaces:**
- Consumes: `normalizarNome`, `nomesJaExistentes` (Task 1); `listarNomesExistentes(): Promise<{ nome: string; grupo: string }[]>` (já existe).

- [ ] **Step 1: Trocar os imports da rota**

```ts
import {
  listarConvitesAdmin,
  criarConviteAdmin,
  listarNomesExistentes,
} from "@/lib/supabase-admin";
import { nomesJaExistentes, normalizarNome } from "@/lib/nome-convidado";
```

- [ ] **Step 2: Trocar a checagem "contém" por "nome igual"**

Substituir o bloco que começa em `// A busca pública (buscar-convite) responde "digite o nome completo"` até o fim do `for` por:

```ts
    // A busca pública (buscar-convite) exige o nome completo, sem diferenciar
    // acento e maiúscula: só um nome IGUAL ao de outro grupo deixaria a busca
    // ambígua.
    const existentes = await listarNomesExistentes();
    const [conflito] = nomesJaExistentes(nomes, existentes);
    if (conflito) {
      return jsonSeguro(
        {
          error: `O nome "${conflito.nome}" já existe no grupo "${conflito.existente.grupo}". Diferencie os nomes.`,
        },
        409,
      );
    }
```

- [ ] **Step 3: Remover `normalizarNome` de `supabase-admin.ts`**

Apagar o comentário "Mesma normalização da busca pública…" e a função `normalizarNome` (linhas 30-39). Conferir com `rg normalizarNome src` que só sobram `nome-convidado.ts`, o teste e a rota.

- [ ] **Step 4: Verificar**

Run: `npx next typegen; npx tsc --noEmit; npm test`
Expected: `tsc` sem saída; testes ok. (Reverter `next-env.d.ts` se mudar.)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/convites/route.ts src/lib/supabase-admin.ts
git commit -m "Only block admin names that equal an existing guest"
```

---

### Task 4: Importação com simulação e checagem antes de gravar

**Files:**
- Modify: `scripts/importar-convidados.mjs` (substituir tudo)
- Create (fora do repositório): `$S/gerar-csv-1o-horario.mjs`, `$S/convidados-1o-horario.csv`

**Interfaces:**
- Consumes: `nomesJaExistentes`, `nomesRepetidos` de `../src/lib/nome-convidado.ts` (Task 1; o Node 24 importa `.ts`).
- Produces: `npm run importar-convidados -- <csv> [--simular]`.

- [ ] **Step 1: Reescrever o script**

`scripts/importar-convidados.mjs`:

```js
// Importa convites (grupos) e seus convidados (pessoas) a partir de um CSV.
//
// Formato esperado do CSV (com header), ex: convidados.csv
//   grupo,nome_exibicao,nome,perfil
//   1,Pedro e Aléxia,Pedro Schuster,cerimonia_festa_after
//   1,Pedro e Aléxia,Aléxia Chaves,cerimonia_festa_after
//   2,Gustavo,Gustavo,cerimonia_festa_after
//   3,Laura,Laura,festa_after
//
// - "grupo": qualquer identificador (número ou texto) que agrupe as pessoas
//   que recebem o mesmo convite/mensagem. Repetido em cada linha do grupo.
// - "nome_exibicao": como o grupo aparece no /admin. Repetido em cada linha.
// - "nome": nome completo da pessoa — é o que ela digita no site para entrar
//   (comparação do nome inteiro, sem acento e sem maiúscula).
// - "perfil": cerimonia_festa_after | festa_after — igual pra todo o grupo.
//
// Antes de gravar, confere se algum nome se repete no próprio CSV ou já
// existe no banco; se sim, para sem gravar nada e lista os casos.
//
// Uso (lê SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do .env.local):
//   npm run importar-convidados -- convidados.csv --simular   (só confere)
//   npm run importar-convidados -- convidados.csv             (grava)

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { nomesJaExistentes, nomesRepetidos } from "../src/lib/nome-convidado.ts";

const argumentos = process.argv.slice(2);
const simular = argumentos.includes("--simular");
const csvPath = argumentos.find((a) => !a.startsWith("--"));

if (!csvPath) {
  console.error("Uso: node scripts/importar-convidados.mjs <arquivo.csv> [--simular]");
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function parseCsv(conteudo) {
  const linhas = conteudo.trim().split("\n");
  const header = linhas[0].split(",").map((h) => h.trim());
  return linhas.slice(1).map((linha) => {
    const valores = linha.split(",").map((v) => v.trim());
    return Object.fromEntries(header.map((h, i) => [h, valores[i]]));
  });
}

async function listarNomesDoBanco() {
  const { data, error } = await supabase
    .from("convidados")
    .select("nome, convites(nome_exibicao)")
    .limit(5000);
  if (error) throw new Error("Erro ao ler os convidados do banco: " + error.message);
  return (data ?? []).map((linha) => {
    const convite = Array.isArray(linha.convites) ? linha.convites[0] : linha.convites;
    return { nome: linha.nome, grupo: convite?.nome_exibicao ?? "" };
  });
}

async function main() {
  const registros = parseCsv(readFileSync(csvPath, "utf-8"));

  // Agrupa as linhas por "grupo"
  const grupos = new Map();
  for (const registro of registros) {
    const { grupo, nome_exibicao, nome, perfil } = registro;

    if (!grupo || !nome_exibicao || !nome || !perfil) {
      console.warn("Linha inválida, pulando:", registro);
      continue;
    }
    if (!["cerimonia_festa_after", "festa_after"].includes(perfil)) {
      console.warn(`Perfil inválido para "${nome}": ${perfil}, pulando.`);
      continue;
    }

    if (!grupos.has(grupo)) {
      grupos.set(grupo, { nome_exibicao, perfil, pessoas: [] });
    }
    grupos.get(grupo).pessoas.push(nome);
  }

  const todosOsNomes = [...grupos.values()].flatMap((g) => g.pessoas);
  const porPerfil = {};
  for (const g of grupos.values()) porPerfil[g.perfil] = (porPerfil[g.perfil] ?? 0) + g.pessoas.length;
  console.log(`CSV: ${grupos.size} convites, ${todosOsNomes.length} pessoas`, porPerfil);

  const repetidos = nomesRepetidos(todosOsNomes);
  const jaNoBanco = nomesJaExistentes(todosOsNomes, await listarNomesDoBanco());

  if (repetidos.length > 0) {
    console.error(`\nNomes repetidos no CSV (${repetidos.length}):`);
    for (const nome of repetidos) console.error(`  - ${nome}`);
  }
  if (jaNoBanco.length > 0) {
    console.error(`\nNomes que já existem no banco (${jaNoBanco.length}):`);
    for (const { nome, existente } of jaNoBanco) console.error(`  - ${nome} (grupo "${existente.grupo}")`);
  }
  if (repetidos.length > 0 || jaNoBanco.length > 0) {
    console.error("\nNada foi gravado.");
    process.exit(1);
  }
  if (simular) {
    console.log("\nSimulação: nenhum conflito. Nada foi gravado.");
    return;
  }

  let totalConvites = 0;
  let totalPessoas = 0;

  for (const [grupo, dados] of grupos) {
    const { data: convite, error: conviteError } = await supabase
      .from("convites")
      .insert({ nome_exibicao: dados.nome_exibicao, perfil: dados.perfil })
      .select("id")
      .single();

    if (conviteError || !convite) {
      console.error(`Erro ao criar convite do grupo "${grupo}":`, conviteError?.message);
      continue;
    }

    const { error: pessoasError } = await supabase
      .from("convidados")
      .insert(dados.pessoas.map((nome) => ({ convite_id: convite.id, nome })));

    if (pessoasError) {
      console.error(`Erro ao inserir pessoas do grupo "${grupo}":`, pessoasError.message);
      continue;
    }

    totalConvites++;
    totalPessoas += dados.pessoas.length;
  }

  console.log(`\n${totalConvites} convites (grupos) importados, com ${totalPessoas} pessoas no total.`);
}

main();
```

- [ ] **Step 2: Gerar o CSV dos 181 (fora do repositório)**

`$S/gerar-csv-1o-horario.mjs`:

```js
import fs from "node:fs";
const base = "C:/Users/pedro/AppData/Local/Temp/claude/C--Users-pedro-Desktop-Eu-Projetos-casamentogulau/35af0ea7-babe-4f36-8b41-0d124d0d5562/scratchpad";
const nomes = JSON.parse(fs.readFileSync(`${base}/convidados-pix6.json`, "utf8"));
if (nomes.length !== 181) throw new Error(`esperava 181 nomes, veio ${nomes.length}`);
const ruins = nomes.filter((n) => /[,"\r\n]/.test(n));
if (ruins.length) throw new Error("nomes com vírgula/aspas/quebra: " + ruins.join(" | "));
const linhas = ["grupo,nome_exibicao,nome,perfil", ...nomes.map((n, i) => `${i + 1},${n},${n},cerimonia_festa_after`)];
fs.writeFileSync(`${base}/convidados-1o-horario.csv`, linhas.join("\n") + "\n");
console.log(`convidados-1o-horario.csv: ${nomes.length} linhas`);
```

Run: `node "$S/gerar-csv-1o-horario.mjs"`
Expected: `convidados-1o-horario.csv: 181 linhas`.

- [ ] **Step 3: Conferir o script sem banco**

Run (sem variáveis): `node scripts/importar-convidados.mjs "$S/convidados-1o-horario.csv" --simular`
Expected: "Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY…" e código 1 (o script carrega, inclusive o import do `.ts`).

- [ ] **Step 4: Simular contra o banco real (só leitura)**

Confirmar que `C:/Users/pedro/Desktop/Eu/Projetos/casamentogulau/.env.local` tem `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (sem imprimir valores).

Run: `node --env-file="C:/Users/pedro/Desktop/Eu/Projetos/casamentogulau/.env.local" scripts/importar-convidados.mjs "$S/convidados-1o-horario.csv" --simular`
Expected: `CSV: 181 convites, 181 pessoas { cerimonia_festa_after: 181 }` e "Simulação: nenhum conflito. Nada foi gravado." — ou a lista de conflitos com o banco, que vai para o Pedro decidir. **Não rodar sem `--simular` aqui.**

- [ ] **Step 5: Commit**

```bash
git add scripts/importar-convidados.mjs
git commit -m "Check for repeated and existing names before importing guests"
```

---

### Task 5: Capa com "Nome completo" (visual do HTML novo) e defesa do nome inteiro

**Files:**
- Modify: `src/lib/supabase-functions.ts:35-41` (erro com status)
- Modify: `src/app/convite-replica/capa-entrada.tsx` (substituir tudo)
- Modify: `src/app/convite-replica/convite-replica.css:49-104` (bloco da entrada)
- Modify (fora do repositório): `$S/mock-funcoes.mjs`

**Interfaces:**
- Consumes: `normalizarNome`, `mesmoNome` (Task 1).
- Produces: `class ErroFuncao extends Error { status: number }` exportada de `supabase-functions.ts`.

- [ ] **Step 1: Erro com status em `supabase-functions.ts`**

Antes de `const FUNCTIONS_URL`:

```ts
/** Erro devolvido por uma Edge Function, com o status HTTP da resposta. */
export class ErroFuncao extends Error {
  status: number;

  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.name = "ErroFuncao";
    this.status = status;
  }
}
```

E em `callFunction`:

```ts
  if (!res.ok) {
    throw new ErroFuncao(data.error || "Erro ao chamar função", res.status);
  }
```

- [ ] **Step 2: `capa-entrada.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { mesmoNome, normalizarNome } from "@/lib/nome-convidado";
import { buscarConvite, ErroFuncao, type Convite } from "@/lib/supabase-functions";

const CHAVE_NOME = "laura-gu:nome-checkin";
const NAO_ENCONTRADO = "Nome não encontrado na lista de convidados.";
const ERRO_REDE = "Não foi possível verificar agora. Tente de novo.";

/** 404 vira o texto do HTML; 400 e 409 mostram o texto do servidor; falha de
    rede, resposta que não é JSON ou erro do servidor viram a mensagem
    genérica. */
function mensagemDeErro(e: unknown) {
  if (e instanceof ErroFuncao) {
    if (e.status === 404) return NAO_ENCONTRADO;
    if (e.status === 400 || e.status === 409) return e.message;
  }
  return ERRO_REDE;
}

/** Campo "Nome completo" + ENTRAR da capa. A busca grava o check-in de quem
    entrou. O ENTRAR fica apagado com o campo vazio (CSS :placeholder-shown). */
export default function CapaEntrada({ aoEntrar }: { aoEntrar: (convite: Convite) => void }) {
  const campo = useRef<HTMLInputElement>(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Preenche o nome lembrado neste aparelho, direto no elemento (sem setState).
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_NOME);
      if (salvo && campo.current && !campo.current.value) campo.current.value = salvo;
    } catch {
      // sem armazenamento: o campo fica em branco
    }
  }, []);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    const texto = campo.current?.value.trim() ?? "";
    if (!normalizarNome(texto) || buscando) return;
    setBuscando(true);
    setErro(null);
    try {
      const convite = await buscarConvite(texto);
      // Só entra com o nome inteiro, mesmo que a função publicada ainda seja a
      // antiga (que achava por pedaço do nome).
      if (!convite.pessoas.some((p) => mesmoNome(p.nome, texto))) {
        setErro(NAO_ENCONTRADO);
        return;
      }
      try {
        localStorage.setItem(CHAVE_NOME, texto);
      } catch {
        // sem armazenamento: só não lembra o nome da próxima vez
      }
      aoEntrar(convite);
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setBuscando(false);
    }
  }

  return (
    <form className="rc-entrada" onSubmit={entrar} noValidate>
      {erro && (
        <p className="rc-entrada-erro" role="alert">
          {erro}
        </p>
      )}
      <input
        ref={campo}
        className="rc-entrada-campo"
        type="text"
        name="nome"
        autoComplete="name"
        placeholder="Nome completo"
        aria-label="Nome completo"
        maxLength={120}
        required
        readOnly={buscando}
        onChange={() => setErro(null)}
      />
      <button type="submit" className="rc-entrar" disabled={buscando}>
        ENTRAR
      </button>
    </form>
  );
}
```

- [ ] **Step 3: CSS da entrada**

Em `convite-replica.css`, substituir do comentário `/* Entrada da capa: campo de nome + ENTRAR…` até o fim de `.rc-entrada-erro { … }` (antes de `/* Névoa de energia dourada`) por:

```css
/* Entrada da capa (HTML novo): ENTRAR a 8% do fundo, o campo 62px acima e a
   mensagem 112px acima, centralizados como no original (filhos absolutos de
   um contêiner flex centralizado do tamanho da capa). */
.rc-entrada {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  justify-content: center;
  pointer-events: none;
}
.rc-entrada > * {
  pointer-events: auto;
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
/* Apagado com o campo vazio (placeholder à mostra) e durante a busca. */
.rc-entrada-campo:placeholder-shown ~ .rc-entrar {
  opacity: 0.55;
  pointer-events: none;
}
.rc-entrar:disabled {
  opacity: 0.55;
}
.rc-entrada-campo {
  position: absolute;
  bottom: calc(8% + 62px);
  /* o original não tem reset: a largura é do conteúdo; padding e borda somam */
  box-sizing: content-box;
  width: min(78%, 360px);
  padding: 13px 18px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 28px;
  background: rgba(20, 12, 6, 0.45);
  color: white;
  text-align: center;
  /* fonte padrão do navegador, como no original; 16px em vez de 15px para o
     iPhone não dar zoom ao focar */
  font: revert;
  font-size: 16px;
  outline: none;
  appearance: none;
}
.rc-entrada-campo::placeholder {
  color: rgba(255, 255, 255, 0.9);
  opacity: 1;
}
.rc-entrada-campo:focus {
  background: rgba(20, 12, 6, 0.58);
}
.rc-entrada-erro {
  position: absolute;
  bottom: calc(8% + 112px);
  width: min(82%, 380px);
  margin: 0;
  text-align: center;
  color: #fff;
  font-size: 13px;
  line-height: 1.35;
  text-shadow: 0 1px 4px #000;
}
```

- [ ] **Step 4: Servidor falso com a regra nova**

Em `$S/mock-funcoes.mjs`:
- `normalizar` passa a colapsar espaços: `s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim()`.
- Grupos: manter `g1` (Ana Souza + Bruno Lima, 1º horário), `g2` (Carla Dias, `festa_after`), `g3` (Família Rocha, 3 pessoas, `tres-3-falha`); acrescentar `g5` = `{ id: "g5", nome_exibicao: "Gil Souza", perfil: "cerimonia_festa_after", pessoas: [p("gil-1", "Gil Souza")] }` e `g6` = `{ id: "g6", nome_exibicao: "Hugo Prado", perfil: "cerimonia_festa_after", pessoas: [p("hugo-falha", "Hugo Prado")] }`.
- `/buscar-convite`: termos especiais `offline`/`quebra` continuam; vazio → 400 "Digite seu nome completo"; com `process.env.MODO === "antigo"` usa "contém" e marca check-in no grupo todo (imita a função publicada hoje); senão compara o nome inteiro, 404 "Nome não encontrado na lista de convidados.", e marca check-in só em quem bateu.

- [ ] **Step 5: Verificar no navegador**

Subir `node "$S/mock-funcoes.mjs"` e o site com `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL=http://localhost:4020 NEXT_PUBLIC_SUPABASE_ANON_KEY=teste npm run dev -- -p 3006` (em segundo plano). A 375 px, com `localStorage` limpo:
- Campo vazio: ENTRAR com opacidade 0.55 e `pointer-events: none`; o campo a `bottom = 8% + 62px`, a mensagem a `8% + 112px`.
- "Gil" → "Nome não encontrado na lista de convidados." acima do campo; digitar some a mensagem.
- "gil   SOUZA" → entra.
- `offline` → mensagem genérica.
- Reiniciar o falso com `MODO=antigo`: "Gil" → a função responde 200, mas o site mostra "Nome não encontrado…" (defesa).

Run: `npx next typegen; npx tsc --noEmit; npm run lint`
Expected: `tsc` sem saída; lint com os 5 problemas de sempre.

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase-functions.ts src/app/convite-replica/capa-entrada.tsx src/app/convite-replica/convite-replica.css
git commit -m "Ask for the full name on the cover, styled like the new invitation"
```

---

### Task 6: Confirmação direta para quem é convite de uma pessoa

**Files:**
- Modify: `src/app/convite-replica/convite-replica.tsx`
- Modify: `src/app/convite-replica/convite-replica.css`

**Interfaces:**
- Consumes: `confirmarPresenca(convidadoId, confirmacoes): Promise<Pessoa>` (já existe); `atualizarPessoas`, `abrirAfter` (já existem no componente).

- [ ] **Step 1: Import, constante, estado**

```ts
import { confirmarPresenca, type Convite, type Pessoa } from "@/lib/supabase-functions";
```

Depois de `type AfterAtivo`:

```ts
const AVISO_FALHA_CONFIRMACAO = "Não conseguimos salvar sua confirmação. Tente de novo.";
```

No componente, junto dos outros estados e refs:

```ts
  const [aviso, setAviso] = useState<string | null>(null);
  const enviandoConfirmacao = useRef(false);
```

- [ ] **Step 2: O aviso some sozinho em 5 s**

Depois do efeito do Esc:

```ts
  // O aviso de falha some sozinho.
  useEffect(() => {
    if (!aviso) return;
    const id = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(id);
  }, [aviso]);
```

- [ ] **Step 3: Função de confirmar**

Depois de `concluirConfirmacao`:

```ts
  // Convite de uma pessoa (a lista do HTML novo): o toque grava direto e abre
  // o After. Grupo maior: abre a janela com uma caixinha por pessoa.
  async function confirmarPresencaDireta() {
    if (!convite || enviandoConfirmacao.current) return;
    if (convite.pessoas.length !== 1) {
      setConfirmando(true);
      return;
    }
    enviandoConfirmacao.current = true;
    setAviso(null);
    const [pessoa] = convite.pessoas;
    try {
      const gravada = await confirmarPresenca(pessoa.id, {
        ...(convite.perfil === "cerimonia_festa_after" ? { confirmou_cerimonia: true } : {}),
        confirmou_festa: true,
      });
      atualizarPessoas([gravada]);
      abrirAfter();
    } catch {
      setAviso(AVISO_FALHA_CONFIRMACAO);
    } finally {
      enviandoConfirmacao.current = false;
    }
  }
```

No botão `rc-confirmar`: `onClick={confirmarPresencaDireta}`.

- [ ] **Step 4: Aviso na tela**

Antes do bloco `<div className={`rc-after…`}>`:

```tsx
      {aviso && (
        <div className="rc-aviso" role="alert">
          {aviso}
        </div>
      )}
```

CSS, depois do bloco da janela de confirmação:

```css
/* Aviso de falha ao gravar a confirmação: pílula escura no pé da tela. */
.rc-aviso {
  position: fixed;
  z-index: 25;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  width: max-content;
  max-width: calc(100vw - 32px);
  padding: 10px 18px;
  border-radius: 30px;
  background: rgba(20, 12, 6, 0.85);
  color: white;
  font: 14px/1.35 Arial, sans-serif;
  text-align: center;
}
```

- [ ] **Step 5: Verificar**

No navegador (servidor falso): "Gil Souza" → Confirmar presença → o falso registra `confirmar-presenca` com `{ convidado_id: "gil-1", confirmou_cerimonia: true, confirmou_festa: true }` (ver `/_log`) e o After abre. "Carla Dias" (`festa_after`) → só `confirmou_festa: true`. "Hugo Prado" → aviso no pé, After não abre, aviso some em 5 s. "Ana Souza" → abre a janela de caixinhas. Dois toques rápidos geram uma chamada só.

Run: `npx tsc --noEmit; npm run lint`
Expected: limpo / 5 problemas.

- [ ] **Step 6: Commit**

```bash
git add src/app/convite-replica/convite-replica.tsx src/app/convite-replica/convite-replica.css
git commit -m "Confirm single-guest invitations with one tap"
```

---

### Task 7: Primeira tela do After clicável

**Files:**
- Modify: `src/app/convite-replica/convite-replica.tsx` (tipo `AfterAtivo`, efeito da sequência, primeira tela)
- Modify: `src/app/convite-replica/convite-replica.css` (`.rc-after-primeiro`, `.rc-after-segundo`)

- [ ] **Step 1: Estado "apagando"**

```ts
/** Qual imagem do After está visível. "apagando" = a confirmada saindo, com
    350ms de preto antes da tela do After (pela troca automática ou pelo toque). */
type AfterAtivo = "nenhum" | "primeiro" | "apagando" | "segundo";
```

- [ ] **Step 2: Trocar o efeito da sequência**

Substituir o efeito "Sequência do After…" (o que agenda 5200 e 350) por:

```ts
  // Sequência do After: com o overlay aberto e as duas imagens apagadas, deixa
  // o navegador pintar um quadro e acende a "confirmada" (fade). 5200ms depois
  // do clique ela apaga (se o convidado ainda não tocou nela).
  useEffect(() => {
    if (!afterAberto) return;
    let segundoQuadro = 0;
    const primeiroQuadro = requestAnimationFrame(() => {
      segundoQuadro = requestAnimationFrame(() => {
        setAtivo((atual) => (atual === "nenhum" ? "primeiro" : atual));
      });
    });
    const automatico = window.setTimeout(() => {
      setAtivo((atual) => (atual === "primeiro" || atual === "nenhum" ? "apagando" : atual));
    }, 5200);
    return () => {
      cancelAnimationFrame(primeiroQuadro);
      cancelAnimationFrame(segundoQuadro);
      clearTimeout(automatico);
    };
  }, [afterAberto]);

  // 350ms de preto entre a "confirmada" e a tela do After.
  useEffect(() => {
    if (ativo !== "apagando") return;
    const id = window.setTimeout(() => setAtivo("segundo"), 350);
    return () => clearTimeout(id);
  }, [ativo]);
```

- [ ] **Step 3: Toque na primeira tela**

```tsx
        <div
          className={`rc-after-slide rc-after-primeiro${ativo === "primeiro" ? " rc-ativo" : ""}`}
          onClick={() => setAtivo((atual) => (atual === "primeiro" ? "apagando" : atual))}
        >
```

- [ ] **Step 4: CSS**

```css
.rc-after-primeiro {
  z-index: 2;
}
/* Como no HTML novo: a "confirmada" recebe toque (pula para o After) e a tela
   do After, acesa, também. */
.rc-after-primeiro.rc-ativo {
  pointer-events: auto;
  cursor: pointer;
}
.rc-after-segundo {
  z-index: 1;
}
.rc-after-segundo.rc-ativo {
  pointer-events: auto;
}
```

- [ ] **Step 5: Verificar**

No navegador (com `requestAnimationFrame` e `matchMedia` substituídos como antes, porque o painel força movimento reduzido e fica oculto): tocar na confirmada aos ~1 s → apaga e, ~350 ms depois, a tela do After acende; a troca automática não repete depois. Sem tocar: troca em ~5,2 s + 350 ms. "← Voltar" e reabrir recomeça do zero.

Run: `npx tsc --noEmit; npm run lint`
Expected: limpo / 5 problemas.

- [ ] **Step 6: Commit**

```bash
git add src/app/convite-replica/convite-replica.tsx src/app/convite-replica/convite-replica.css
git commit -m "Let a tap on the confirmed screen skip to the After"
```

---

### Task 8: Pix do After com tela do comprovante; ajustes da janela Pix

**Files:**
- Create: `public/convite/pix-copiado.png` (cópia de `$S/pix6-imagens/p10.png`)
- Modify: `src/app/convite-replica/dados.ts` (constantes do After)
- Modify: `src/app/convite-replica/versoes.ts` (campos do After na `Versao`)
- Modify: `src/app/convite-replica/convite-replica.tsx`
- Modify: `src/app/convite-replica/convite-replica.css`

**Interfaces:**
- Produces (`versoes.ts`): `Versao.valorAfter: string`, `Versao.comprovanteAfter: Imagem`, `Versao.whatsappComprovante: string`.

- [ ] **Step 1: Imagem**

Run: `Copy-Item "$S/pix6-imagens/p10.png" public/convite/pix-copiado.png` e conferir o SHA-256 igual ao da origem (`Get-FileHash`), 1024×1536.

- [ ] **Step 2: Dados e versão**

`dados.ts`, depois de `PIX_AFTER`:

```ts
/** Valor mostrado na janela Pix do After (o mesmo do código acima). */
export const VALOR_AFTER = "R$ 85,90";

/** Link do botão "ENVIE O COMPROVANTE AQUI" (tela depois de copiar o Pix do After). */
export const WHATSAPP_COMPROVANTE = "https://wa.me/5551998146645";
```

`versoes.ts`: importar `VALOR_AFTER` e `WHATSAPP_COMPROVANTE`; em `Versao`, depois de `pixAfter`:

```ts
  valorAfter: string;
  /** Tela "PIX COPIADO" que aparece depois de copiar o Pix do After. */
  comprovanteAfter: Imagem;
  whatsappComprovante: string;
```

Em `VERSAO_PRIMEIRO_HORARIO`, depois de `pixAfter: PIX_AFTER,`:

```ts
  valorAfter: VALOR_AFTER,
  comprovanteAfter: {
    src: "/convite/pix-copiado.png",
    largura: 1024,
    altura: 1536,
    alt: "Instrução para envio do comprovante via WhatsApp",
  },
  whatsappComprovante: WHATSAPP_COMPROVANTE,
```

- [ ] **Step 3: Estado do Pix no componente**

Remover a função `copiarTexto` (não é mais usada). Antes de `export default function ConviteReplica`:

```ts
/** O que a janela Pix mostra: um presente ou o After. */
type PixAberto = { nome: string; valor: string; codigo: string; doAfter: boolean };
```

Trocar `const [presente, setPresente] = useState<number | null>(null);` por:

```ts
  const [pix, setPix] = useState<PixAberto | null>(null);
  const [comprovante, setComprovante] = useState(false);
```

- [ ] **Step 4: Esc fecha primeiro o comprovante**

Substituir o efeito "Esc fecha o modal Pix." por:

```ts
  // Esc fecha primeiro a tela do comprovante; com ela fechada, a janela Pix.
  useEffect(() => {
    if (pix === null && !comprovante) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (comprovante) setComprovante(false);
      else setPix(null);
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [pix, comprovante]);
```

- [ ] **Step 5: Copiar, abrir presente, abrir Pix do After**

`fecharAfter` ganha `setComprovante(false);`. Substituir `copiarPresente` e `abrirPresente` por:

```ts
  // Copia o código da janela Pix. No After, depois de copiar, troca a janela
  // pela tela do comprovante (180ms), como no HTML novo.
  async function copiarPix(dados: PixAberto) {
    let copiado = false;
    try {
      await navigator.clipboard.writeText(dados.codigo);
      copiado = true;
    } catch {
      campoPix.current?.focus();
      campoPix.current?.select();
      try {
        copiado = document.execCommand("copy");
      } catch {
        copiado = false;
      }
    }
    if (!copiado) {
      setStatusPix("Selecione o código acima e copie manualmente.");
      return;
    }
    setStatusPix("Pix Copia e Cola copiado. Agora é só colar no aplicativo do seu banco.");
    if (dados.doAfter) {
      window.setTimeout(() => {
        setPix(null);
        setComprovante(true);
      }, 180);
    }
  }

  function abrirPresente(indice: number) {
    const presente = versao.presentes[indice];
    const dados = { nome: presente.nome, valor: presente.valor, codigo: presente.pix, doAfter: false };
    setPix(dados);
    setStatusPix("");
    // Os presentes continuam copiando sozinhos ao abrir (decisão do Pedro).
    setTimeout(() => copiarPix(dados), 60);
  }

  function abrirPixAfter() {
    setPix({ nome: "After", valor: versao.valorAfter, codigo: versao.pixAfter, doAfter: true });
    setStatusPix("");
  }
```

Remover a linha `const dadosPresente = presente === null ? null : versao.presentes[presente];`.

- [ ] **Step 6: Área do Pix do After**

```tsx
          <a
            className="rc-pix-area"
            aria-label="Abrir Pix do After"
            href="#"
            style={areaPix}
            onClick={(e) => {
              e.preventDefault();
              abrirPixAfter();
            }}
          />
```

- [ ] **Step 7: Janela Pix e tela do comprovante**

Substituir o bloco do modal Pix por:

```tsx
      <div
        className={`rc-pix-modal${pix !== null ? " rc-mostrar" : ""}`}
        aria-hidden={pix === null}
        onClick={(e) => {
          if (e.target === e.currentTarget) setPix(null);
        }}
      >
        <div className="rc-pix-card" role="dialog" aria-modal="true" aria-labelledby="rc-pix-titulo">
          <h3 id="rc-pix-titulo">PRESENTE SELECIONADO</h3>
          <div className="rc-pix-nome">{pix?.nome}</div>
          <div className="rc-pix-valor">{pix?.valor}</div>
          <textarea ref={campoPix} readOnly aria-label="Pix Copia e Cola" value={pix?.codigo ?? ""} />
          <div className="rc-pix-acoes">
            <button type="button" className="rc-pix-copiar" onClick={() => pix && copiarPix(pix)}>
              COPIAR PIX
            </button>
            <button type="button" className="rc-pix-fechar" onClick={() => setPix(null)}>
              FECHAR
            </button>
          </div>
          <div className="rc-pix-status">{statusPix}</div>
        </div>
      </div>

      {/* Tela do comprovante: montada com o After aberto, para a imagem
          (1,9 MB) só carregar quando pode ser usada. */}
      {afterAberto && (
        <div
          className={`rc-comprovante${comprovante ? " rc-mostrar" : ""}`}
          aria-hidden={!comprovante}
          onClick={(e) => {
            const alvo = e.target as HTMLElement;
            if (alvo === e.currentTarget || alvo.classList.contains("rc-comprovante-moldura")) {
              setComprovante(false);
            }
          }}
        >
          <div className="rc-comprovante-moldura" role="presentation">
            <Foto imagem={versao.comprovanteAfter} />
            <a
              className="rc-comprovante-whatsapp"
              href={versao.whatsappComprovante}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Enviar comprovante pelo WhatsApp para 51 99814-6645"
            >
              ENVIE O COMPROVANTE AQUI
            </a>
          </div>
        </div>
      )}
```

- [ ] **Step 8: CSS**

`.rc-pix-valor`: `margin-bottom: 10px;`. Depois de `.rc-pix-status { … }`:

```css
/* O HTML novo define este estilo para uma nota do comprovante e não o usa;
   mantido igual. */
.rc-pix-nota {
  font-size: 13px;
  line-height: 1.4;
  margin: 0 0 14px;
  color: #6a421d;
}
.rc-pix-nota strong {
  font-weight: 700;
  white-space: nowrap;
}

/* ── Tela do comprovante (depois de copiar o Pix do After) ────────────── */
.rc-comprovante {
  position: fixed;
  inset: 0;
  z-index: 10001;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(5px);
}
.rc-comprovante.rc-mostrar {
  display: flex;
}
.rc-comprovante-moldura {
  position: relative;
  display: inline-block;
  max-width: 96vw;
  max-height: 92vh;
  line-height: 0;
}
.rc-comprovante img {
  display: block;
  max-width: 96vw;
  max-height: 92vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.55);
}
.rc-comprovante-whatsapp {
  position: absolute;
  left: 12%;
  top: 86%;
  width: 76%;
  height: 6%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  background: rgba(92, 55, 27, 0.96);
  color: #fff4df;
  text-decoration: none;
  border: 1px solid rgba(230, 194, 135, 0.95);
  border-radius: 999px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(12px, 2.5vw, 22px);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-align: center;
  box-shadow: 0 5px 18px rgba(0, 0, 0, 0.28);
  z-index: 5;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.rc-comprovante-whatsapp:active {
  transform: scale(0.98);
  background: rgba(74, 42, 20, 0.98);
}
```

- [ ] **Step 9: Verificar**

No navegador (375 px e 1280 px): tocar no Pix da tela do After → janela "PRESENTE SELECIONADO / After / R$ 85,90" com o código do After, sem status (não copiou); COPIAR PIX → status de copiado e, ~180 ms depois, a janela some e aparece a tela do comprovante; o link tem `href` `https://wa.me/5551998146645` e `target="_blank"`, posição 12%/86%/76%/6% da imagem; tocar fora fecha; Esc fecha o comprovante e, com a janela aberta, a janela. Presente → janela com status de copiado (cópia automática), sem comprovante. Margem do valor 10px.

Run: `npx tsc --noEmit; npm run lint`
Expected: limpo / 5 problemas.

- [ ] **Step 10: Commit**

```bash
git add public/convite/pix-copiado.png src/app/convite-replica/dados.ts src/app/convite-replica/versoes.ts src/app/convite-replica/convite-replica.tsx src/app/convite-replica/convite-replica.css
git commit -m "Open the After Pix in the Pix window and show the receipt screen after copying"
```

---

### Task 9: Sem chuva de estrelas

**Files:**
- Modify: `src/app/convite-replica/convite-replica.tsx` (import e uso de `ChuvaBrilho`)
- Modify: `src/app/convite-replica/convite-replica.css:1-5` (comentário de origem)

- [ ] **Step 1: Remover**

Apagar `import ChuvaBrilho from "../components/chuva-brilho";` e o bloco:

```tsx
      {/* Chuva de estrelas por cima das telas (z-index 15): abaixo do After, das
          janelas e do modal Pix, e sem capturar cliques. Só depois de entrar. */}
      {aberto && <ChuvaBrilho />}
```

O arquivo `src/app/components/chuva-brilho.tsx` e o CSS dele ficam (sem uso).

- [ ] **Step 2: Comentário de origem do CSS**

```css
/* Réplica do convite interativo — CSS portado do HTML de referência
   (convite_Laura_Gustavo_presentes_pix-2.html, atualizado com o pix-6).
   Valores, cores e tempos são os do original; só mudam os nomes (prefixo
   .rc-) e as correções de desktop (>= 700px), onde o original tem imagem
   colada à esquerda e áreas clicáveis desalinhadas. */
```

- [ ] **Step 3: Verificar**

Depois de entrar: nenhum `canvas.chuva-brilho` na página. `rg ChuvaBrilho src` só acha o próprio componente.

- [ ] **Step 4: Commit**

```bash
git add src/app/convite-replica/convite-replica.tsx src/app/convite-replica/convite-replica.css
git commit -m "Remove the falling stars from the invitation, as in the new HTML"
```

---

### Task 10: Verificação final, importação e entrega

**Files:**
- Modify: `docs/superpowers/plans/2026-10-05-convite-pix6.md` (registro da execução)

- [ ] **Step 1: Suíte completa**

Run: `npm test; deno run -A "$S/testar-buscar-convite.ts"; npx next typegen; npx tsc --noEmit; npm run lint; npm run build`
Expected: testes ok; 10 casos ok; `tsc` limpo; lint com 5 problemas; build verde. Reverter `next-env.d.ts`.

- [ ] **Step 2: Passada no navegador (servidor falso, 375 px e 1280 px)**

Repetir os cenários das Tasks 5–9 em sequência numa visita só: entrada errada → certa → telas (mesmas medidas de antes: 7 seções, áreas) → presentes copiando sozinhos → confirmar (Gil) → After tocando na confirmada → Pix do After → comprovante → Esc/fora → Voltar. Console sem erros.

- [ ] **Step 3: Registro da execução**

Acrescentar ao fim deste plano a seção "Execução" com o que foi feito, os resultados das verificações e o relatório do `--simular`.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-10-05-convite-pix6.md
git commit -m "Record execution notes in the pix-6 plan"
```

- [ ] **Step 5: Entrega ao Pedro (sem gravar nada sozinho)**

- Enviar o arquivo `supabase/functions/buscar-convite/index.ts` para ele publicar no painel do Supabase.
- Mostrar o relatório do `--simular`; pedir o "ok" para a gravação real (`node --env-file=… scripts/importar-convidados.mjs "$S/convidados-1o-horario.csv"`), que só roda depois da resposta.
- Oferecer o push/PR (menu do finishing-a-development-branch).

---

## Execução (2026-10-05)

Tasks 1–9 executadas na ordem, um commit por task, mais um commit extra
(`Drop the unused catch binding in buscar-convite`: `catch {}` em vez de
`catch (_err)`, que derruba o aviso de lint que a função já tinha — o lint
caiu de 5 para 4 problemas, todos antigos).

Desvios do plano:

- **Preview:** o `preview_start` lê o `.claude/launch.json` do checkout
  principal e subiu o servidor dele (porta 3000, com o `.env` do Supabase
  real) — foi parado na hora, sem uso. O site do worktree rodou com
  `npm run dev -- -p 3006` em segundo plano e um `.env.local` local
  (ignorado pelo git) apontando para o servidor falso na 4020.
- **Teste da função:** o caso "acento, maiúscula e espaços extras" também
  falhava na função antiga por outro motivo — ela não junta espaços
  repetidos no meio do nome ("JOÃO   Luiz" dava 404). A nova corrige.

Resultados:

- `npm test`: 4/4. Função em Deno contra PostgREST falso: 8 falhas na versão
  antiga, 10/10 na nova; `deno check` limpo.
- `tsc` limpo; lint 4 problemas (3 erros, 1 aviso, todos de antes);
  `npm run build` verde.
- Importação `--simular` contra o banco real (só leitura):
  `CSV: 181 convites, 181 pessoas { cerimonia_festa_after: 181 }` —
  "Simulação: nenhum conflito. Nada foi gravado."
- Navegador, 375 px e 1280 px, servidor falso:
  - capa: ENTRAR a 8% do fundo, apagado (0.55, sem toque) com o campo vazio;
    campo a 8% + 62px, 78% (+38px de padding/borda) ou 398px, raio 28px,
    16px; mensagem a 8% + 112px, Georgia 13px com sombra;
  - "Gil"/"Souza" → "Nome não encontrado…"; digitar apaga a mensagem;
    falha de rede → mensagem genérica; "gil   SOUZA" entra e fica lembrado;
    com o falso imitando a função antiga, "Gil" (200 do servidor) é recusado
    pelo site;
  - confirmação: Gil (1º horário) grava `confirmou_cerimonia` e
    `confirmou_festa` numa chamada só mesmo com dois toques e abre o After;
    Carla (2º) grava só `confirmou_festa`; Hugo (falha) mostra o aviso no pé,
    não abre o After, aviso some em ~5 s; Ana (grupo de 2) abre a janela;
  - After: toque na confirmada aos 1016 ms → apaga em 1023 ms, After acende
    em 1383 ms, sem repetir aos 5,2 s; sem toque: 58 / 5222 / 5584 ms (antes:
    42 / 5221 / 5571); Voltar e reabrir recomeçam;
  - Pix do After: janela "PRESENTE SELECIONADO / After / R$ 85,90" com o
    código do After, sem copiar sozinha; COPIAR → status e, 180 ms depois,
    tela do comprovante (z-index 10001), imagem 360×540 (375 px) ou 491×736
    (1280 px); link "ENVIE O COMPROVANTE AQUI" em 12/86/76/6% da imagem,
    `https://wa.me/5551998146645`, nova aba; tocar na imagem não fecha, tocar
    fora fecha; Esc fecha o comprovante e depois a janela; cópia que falha →
    "Selecione o código acima…", sem comprovante; a imagem só é montada com o
    After aberto;
  - presentes: continuam copiando sozinhos (status aos 60 ms), sem
    comprovante; margem do valor 10px;
  - sem `canvas` de estrelas nem barra de navegação; 7 telas de 568px
    (sobrepostas 5px), 20 áreas clicáveis; console limpo num fluxo completo.

Pendente com o Pedro: publicar a nova `buscar-convite`, dar o "ok" para a
gravação real dos 181 nomes e decidir o push/PR.
