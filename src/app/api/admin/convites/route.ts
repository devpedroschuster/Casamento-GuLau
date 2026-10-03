import { NextResponse } from "next/server";
import {
  listarConvitesAdmin,
  criarConviteAdmin,
  listarNomesExistentes,
  normalizarNome,
} from "@/lib/supabase-admin";
import type { Perfil } from "@/lib/supabase-functions";

const PERFIS_VALIDOS: Perfil[] = ["cerimonia_festa_after", "festa_after"];
const MAX_CARACTERES = 120;
const MAX_PESSOAS = 30;

// Toda resposta desta rota (sucesso ou erro) sai sem cache e fora dos buscadores:
// a página /admin não tem login, só não é divulgada.
function jsonSeguro(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

// Remove espaços nas pontas e colapsa qualquer sequência de espaços em um só,
// mantendo maiúsculas e acentos originais (é o que fica salvo no banco).
function limparEspacos(texto: string): string {
  return texto.replace(/\s+/g, " ").trim();
}

export async function GET() {
  try {
    const convites = await listarConvitesAdmin();
    return jsonSeguro({ convites });
  } catch (error) {
    console.error(error);
    return jsonSeguro({ error: "Erro ao carregar a lista de convidados" }, 500);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const nomeExibicao = typeof body?.nome_exibicao === "string" ? body.nome_exibicao.trim() : "";
  const perfil = body?.perfil as Perfil;

  const nomesLimpos: string[] = Array.isArray(body?.nomes)
    ? body.nomes
        .filter((n: unknown): n is string => typeof n === "string")
        .map(limparEspacos)
        .filter((n: string) => normalizarNome(n).length > 0)
    : [];

  // Remove duplicatas exatas dentro do próprio pedido (ignora caixa e acento).
  const vistos = new Set<string>();
  const nomes: string[] = [];
  for (const nome of nomesLimpos) {
    const chave = normalizarNome(nome);
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    nomes.push(nome);
  }

  if (!nomeExibicao) {
    return jsonSeguro({ error: "Digite o nome do grupo" }, 400);
  }
  if (nomeExibicao.length > MAX_CARACTERES) {
    return jsonSeguro({ error: `O nome do grupo pode ter no máximo ${MAX_CARACTERES} caracteres` }, 400);
  }
  if (!PERFIS_VALIDOS.includes(perfil)) {
    return jsonSeguro({ error: "Escolha uma lista válida" }, 400);
  }
  if (nomes.length === 0) {
    return jsonSeguro({ error: "Adicione pelo menos uma pessoa" }, 400);
  }
  if (nomes.some((n) => n.length > MAX_CARACTERES)) {
    return jsonSeguro({ error: `Cada nome pode ter no máximo ${MAX_CARACTERES} caracteres` }, 400);
  }
  if (nomes.length > MAX_PESSOAS) {
    return jsonSeguro({ error: `Um grupo pode ter no máximo ${MAX_PESSOAS} pessoas` }, 400);
  }

  try {
    // A busca pública (buscar-convite) responde "digite o nome completo" quando o
    // texto bate com pessoas de mais de um grupo (comparação por "contém"). Então
    // um nome novo não pode conter, nem estar contido, em nome de OUTRO grupo.
    // Nomes dentro do mesmo grupo novo podem se sobrepor livremente.
    const existentes = await listarNomesExistentes();
    const existentesNormalizados = existentes
      .map((e) => ({ ...e, normalizado: normalizarNome(e.nome) }))
      .filter((e) => e.normalizado.length > 0);

    for (const nome of nomes) {
      const novo = normalizarNome(nome);
      const conflito = existentesNormalizados.find(
        (e) => e.normalizado.includes(novo) || novo.includes(e.normalizado),
      );
      if (conflito) {
        return jsonSeguro(
          {
            error: `O nome "${nome}" conflita com "${conflito.nome}" (grupo "${conflito.grupo}"): um contém o outro, então a busca dos convidados ficaria ambígua. Use o nome completo ou diferencie os nomes.`,
          },
          409,
        );
      }
    }

    const convite = await criarConviteAdmin({ nome_exibicao: nomeExibicao, perfil, nomes });
    return jsonSeguro({ convite }, 201);
  } catch (error) {
    console.error(error);
    return jsonSeguro({ error: "Erro ao salvar o novo grupo" }, 500);
  }
}
