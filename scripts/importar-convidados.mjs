// Importa convidados a partir de um CSV e gera o link individual de cada um.
//
// Formato esperado do CSV (com header), ex: convidados.csv
//   nome,perfil
//   João Silva,cerimonia_festa_after
//   Maria Souza,festa_after
//
// Uso:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SITE_URL=https://convite-laura-gu.vercel.app \
//   node scripts/importar-convidados.mjs convidados.csv
//
// Gera convidados-links.csv com nome, slug e link pronto para disparo manual.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const [, , csvPath] = process.argv;

if (!csvPath) {
  console.error("Uso: node scripts/importar-convidados.mjs <arquivo.csv>");
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = process.env.SITE_URL || "https://casamentogulau.vercel.app";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function gerarSlug(nome, usados) {
  const base = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

  let slug = base;
  let contador = 2;
  while (usados.has(slug)) {
    slug = `${base}-${contador}`;
    contador++;
  }
  usados.add(slug);
  return slug;
}

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
  const slugsUsados = new Set();
  const resultado = [];

  for (const registro of registros) {
    const { nome, perfil } = registro;

    if (!nome || !perfil) {
      console.warn("Linha inválida, pulando:", registro);
      continue;
    }
    if (!["cerimonia_festa_after", "festa_after"].includes(perfil)) {
      console.warn(`Perfil inválido para "${nome}": ${perfil}, pulando.`);
      continue;
    }

    const slug = gerarSlug(nome, slugsUsados);

    const { error } = await supabase.from("convidados").insert({ nome, perfil, slug });

    if (error) {
      console.error(`Erro ao inserir "${nome}":`, error.message);
      continue;
    }

    resultado.push({ nome, slug, link: `${SITE_URL}/convite/${slug}` });
  }

  const csvSaida = [
    "nome,slug,link",
    ...resultado.map((r) => `${r.nome},${r.slug},${r.link}`),
  ].join("\n");

  writeFileSync("convidados-links.csv", csvSaida, "utf-8");
  console.log(`\n${resultado.length} convidados importados. Links salvos em convidados-links.csv`);
}

main();
