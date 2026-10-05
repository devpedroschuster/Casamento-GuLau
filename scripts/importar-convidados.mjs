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
