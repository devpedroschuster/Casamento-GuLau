import { test } from "node:test";
import assert from "node:assert/strict";
import {
  avisoExclusao,
  calcularResumo,
  filtrarPorSituacao,
  linhasDosConvites,
  removerPessoa,
  substituirPessoa,
} from "./resumo.ts";

const pessoa = (id, nome, extra = {}) => ({
  id,
  nome,
  checkin_em: null,
  confirmou_cerimonia: null,
  confirmou_festa: null,
  confirmou_after: null,
  status_pagamento_after: "nao_aplicavel",
  ...extra,
});

const convites = [
  {
    id: "c1",
    nome_exibicao: "Bruna Monteiro",
    perfil: "cerimonia_festa_after",
    criado_em: "2026-10-05T00:00:00Z",
    convidados: [
      pessoa("p1", "Bruna Monteiro", {
        checkin_em: "2026-10-05T20:00:00Z",
        confirmou_cerimonia: true,
        confirmou_festa: true,
        confirmou_after: true,
        status_pagamento_after: "pago",
      }),
    ],
  },
  {
    id: "c2",
    nome_exibicao: "Álvaro Dias",
    perfil: "cerimonia_festa_after",
    criado_em: "2026-10-05T00:00:00Z",
    convidados: [pessoa("p2", "Álvaro Dias", { checkin_em: "2026-10-05T21:00:00Z" })],
  },
  {
    id: "c3",
    nome_exibicao: "Família Rocha",
    perfil: "festa_after",
    criado_em: "2026-10-05T00:00:00Z",
    convidados: [
      pessoa("p3", "Diego Rocha", { checkin_em: "2026-10-05T22:00:00Z", confirmou_festa: true }),
      pessoa("p4", "Elisa Rocha", { confirmou_festa: false }),
    ],
  },
];

test("linhasDosConvites: uma linha por pessoa, em ordem alfabética, com horário e grupo", () => {
  const linhas = linhasDosConvites(convites);
  assert.deepEqual(
    linhas.map((l) => l.nome),
    ["Álvaro Dias", "Bruna Monteiro", "Diego Rocha", "Elisa Rocha"],
  );
  assert.equal(linhas[2].perfil, "festa_after");
  assert.equal(linhas[2].grupo, "Família Rocha");
  assert.equal(linhas[2].tamanhoGrupo, 2);
  assert.equal(linhas[0].tamanhoGrupo, 1);
});

test("calcularResumo conta por horário e no total", () => {
  const resumo = calcularResumo(linhasDosConvites(convites));
  assert.deepEqual(resumo.primeiro, { convidados: 2, entraram: 2, confirmaram: 1, afterPago: 1 });
  assert.deepEqual(resumo.segundo, { convidados: 2, entraram: 1, confirmaram: 1, afterPago: 0 });
  assert.deepEqual(resumo.total, { convidados: 4, entraram: 3, confirmaram: 2, afterPago: 1 });
});

test("filtrarPorSituacao separa confirmados, After pago e quem falta pagar", () => {
  const linhas = linhasDosConvites(convites);
  const nomes = (filtro) => filtrarPorSituacao(linhas, filtro).map((l) => l.nome);
  assert.deepEqual(nomes("todos"), ["Álvaro Dias", "Bruna Monteiro", "Diego Rocha", "Elisa Rocha"]);
  assert.deepEqual(nomes("confirmaram"), ["Bruna Monteiro", "Diego Rocha"]);
  assert.deepEqual(nomes("after_pago"), ["Bruna Monteiro"]);
  assert.deepEqual(nomes("falta_pagar"), ["Álvaro Dias", "Diego Rocha", "Elisa Rocha"]);
});

test("substituirPessoa troca só a pessoa indicada, sem mexer no original", () => {
  const novos = substituirPessoa(convites, "p3", { confirmou_after: true, status_pagamento_after: "pago" });
  assert.equal(novos[2].convidados[0].status_pagamento_after, "pago");
  assert.equal(novos[2].convidados[0].confirmou_after, true);
  assert.equal(novos[2].convidados[1].status_pagamento_after, "nao_aplicavel");
  assert.equal(convites[2].convidados[0].status_pagamento_after, "nao_aplicavel");
  assert.equal(novos[0], convites[0]);
});

test("removerPessoa tira só a pessoa indicada e mantém o nome do grupo, sem mexer no original", () => {
  const novos = removerPessoa(convites, "p3");
  assert.deepEqual(
    novos[2].convidados.map((p) => p.id),
    ["p4"],
  );
  assert.equal(novos[2].nome_exibicao, "Família Rocha");
  assert.equal(convites[2].convidados.length, 2);
  assert.equal(novos[0], convites[0]);
});

test("removerPessoa renomeia só o grupo da pessoa quando vem um novo nome", () => {
  const novos = removerPessoa(convites, "p3", "Elisa Rocha");
  assert.equal(novos[2].nome_exibicao, "Elisa Rocha");
  assert.equal(novos[0].nome_exibicao, "Bruna Monteiro");
});

test("removerPessoa tira o grupo junto com a última pessoa", () => {
  const novos = removerPessoa(convites, "p1");
  assert.deepEqual(
    novos.map((c) => c.id),
    ["c2", "c3"],
  );
});

test("avisoExclusao avisa quem pagou o After ou já respondeu, e ninguém mais", () => {
  assert.equal(avisoExclusao(pessoa("p", "Paga", { status_pagamento_after: "pago" })), "Essa pessoa já pagou o After.");
  assert.equal(avisoExclusao(pessoa("p", "Vai", { confirmou_festa: true })), "Essa pessoa já confirmou presença.");
  assert.equal(avisoExclusao(pessoa("p", "Não vai", { confirmou_festa: false })), "Essa pessoa já respondeu que não vai.");
  assert.equal(avisoExclusao(pessoa("p", "Só entrou", { checkin_em: "2026-10-05T20:00:00Z" })), null);
});
