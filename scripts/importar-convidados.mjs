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
// - "nome_exibicao": como o grupo é chamado na saudação da mensagem
//   (ex: "Olá, Pedro e Aléxia!"). Repetido em cada linha do grupo.
// - "nome": nome da pessoa, é o que ela vai digitar no site pra se achar.
// - "perfil": cerimonia_festa_after | festa_after — igual pra todo o grupo.
//
// Uso:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/importar-convidados.mjs convidados.csv
//
// Não gera mais links individuais — o convite é o mesmo site pra todo mundo,
// e cada grupo recebe apenas a mensagem personalizada por WhatsApp/e-mail,
// sem link exclusivo (ex: "Olá, Pedro e Aléxia! Confirme em https://...").

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const [, , csvPath] = process.argv;

if (!csvPath) {
  console.error("Uso: node scripts/importar-convidados.mjs <arquivo.csv>");
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function parseCsv(conteudo) {
  const linhas = conteudo.trim().split("\n");
  const header = linhas[0].split(",").map((h) => h.trim());
  return linhas.slice(1).map((linha) => {
    const valores = linha.split(",").map((v) => v.trim());
    return Object.fromEntries(header.map((h, i) => [h, valores[i]]));
  });
}

async function main() {
  const conteudo = readFileSync(csvPath, "utf-8");
  const registros = parseCsv(conteudo);

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
