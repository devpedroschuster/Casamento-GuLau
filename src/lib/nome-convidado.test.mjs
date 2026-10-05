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
