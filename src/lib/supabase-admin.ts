// Usa a service role key do Supabase — só pode ser importado por código que
// roda no servidor (Route Handlers do App Router). Nunca importe este
// arquivo de um componente "use client": a chave nunca pode chegar ao
// navegador.
import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Perfil, Pessoa } from "@/lib/supabase-functions";

export interface ConviteAdmin {
  id: string;
  nome_exibicao: string;
  perfil: Perfil;
  criado_em: string;
  convidados: Pessoa[];
}

function criarClienteAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidos no servidor");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function listarNomesExistentes(): Promise<{ nome: string; grupo: string }[]> {
  const supabase = criarClienteAdmin();

  const { data, error } = await supabase
    .from("convidados")
    .select("nome, convites(nome_exibicao)")
    .limit(5000);

  if (error) {
    throw new Error("Erro ao listar nomes existentes: " + error.message);
  }

  type Linha = {
    nome: string;
    convites: { nome_exibicao: string } | { nome_exibicao: string }[] | null;
  };

  return ((data ?? []) as unknown as Linha[]).map((linha) => {
    const convite = Array.isArray(linha.convites) ? linha.convites[0] : linha.convites;
    return { nome: linha.nome, grupo: convite?.nome_exibicao ?? "" };
  });
}

const COLUNAS_CONVIDADO =
  "id, nome, checkin_em, confirmou_cerimonia, confirmou_festa, confirmou_after, status_pagamento_after, valor_after, respondido_em";

export async function listarConvitesAdmin(): Promise<ConviteAdmin[]> {
  const supabase = criarClienteAdmin();

  const { data, error } = await supabase
    .from("convites")
    .select(`id, nome_exibicao, perfil, criado_em, convidados (${COLUNAS_CONVIDADO})`)
    .order("criado_em", { ascending: false })
    .order("nome", { referencedTable: "convidados" });

  if (error) {
    throw new Error("Erro ao listar convites: " + error.message);
  }

  return (data ?? []) as unknown as ConviteAdmin[];
}

export async function criarConviteAdmin(params: {
  nome_exibicao: string;
  perfil: Perfil;
  nomes: string[];
}): Promise<ConviteAdmin> {
  const supabase = criarClienteAdmin();

  const { data: convite, error: conviteError } = await supabase
    .from("convites")
    .insert({ nome_exibicao: params.nome_exibicao, perfil: params.perfil })
    .select("id, nome_exibicao, perfil, criado_em")
    .single();

  if (conviteError || !convite) {
    throw new Error("Erro ao criar convite: " + conviteError?.message);
  }

  const { data: convidados, error: convidadosError } = await supabase
    .from("convidados")
    .insert(params.nomes.map((nome) => ({ convite_id: convite.id, nome })))
    .select(COLUNAS_CONVIDADO);

  if (convidadosError) {
    // Desfaz o convite recém-criado para não deixar um grupo vazio órfão
    // (os convidados já inseridos, se houver, caem junto via ON DELETE CASCADE).
    const { error: rollbackError } = await supabase.from("convites").delete().eq("id", convite.id);
    if (rollbackError) {
      console.error("Falha ao desfazer o convite " + convite.id + ": " + rollbackError.message);
    }
    throw new Error("Erro ao criar convidados: " + convidadosError.message);
  }

  return { ...convite, convidados: (convidados ?? []) as unknown as Pessoa[] };
}
