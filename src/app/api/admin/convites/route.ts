import { NextResponse } from "next/server";
import { listarConvitesAdmin, criarConviteAdmin } from "@/lib/supabase-admin";
import type { Perfil } from "@/lib/supabase-functions";

const PERFIS_VALIDOS: Perfil[] = ["cerimonia_festa_after", "festa_after"];

export async function GET() {
  try {
    const convites = await listarConvitesAdmin();
    return NextResponse.json({ convites });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao carregar a lista de convidados" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const nomeExibicao = typeof body?.nome_exibicao === "string" ? body.nome_exibicao.trim() : "";
  const perfil = body?.perfil as Perfil;
  const nomes: string[] = Array.isArray(body?.nomes)
    ? body.nomes
        .filter((n: unknown): n is string => typeof n === "string" && n.trim().length > 0)
        .map((n: string) => n.trim())
    : [];

  if (!nomeExibicao) {
    return NextResponse.json({ error: "Digite o nome do grupo" }, { status: 400 });
  }
  if (!PERFIS_VALIDOS.includes(perfil)) {
    return NextResponse.json({ error: "Escolha uma lista válida" }, { status: 400 });
  }
  if (nomes.length === 0) {
    return NextResponse.json({ error: "Adicione pelo menos uma pessoa" }, { status: 400 });
  }

  try {
    const convite = await criarConviteAdmin({ nome_exibicao: nomeExibicao, perfil, nomes });
    return NextResponse.json({ convite }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao salvar o novo grupo" }, { status: 500 });
  }
}
