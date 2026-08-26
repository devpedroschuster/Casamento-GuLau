export type Perfil = "cerimonia_festa_after" | "festa_after";

export interface Pessoa {
  id: string;
  nome: string;
  confirmou_cerimonia: boolean | null;
  confirmou_festa: boolean | null;
  confirmou_after: boolean | null;
  status_pagamento_after: "pendente" | "pago" | "nao_aplicavel";
  valor_after: number | null;
  respondido_em: string | null;
}

export interface Convite {
  id: string;
  nome_exibicao: string;
  perfil: Perfil;
  pessoas: Pessoa[];
}

const FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Erro ao chamar função");
  }

  return data;
}

/** Busca o convite (grupo) a partir de um nome digitado pelo convidado. */
export async function buscarConvite(busca: string) {
  const { convite } = await callFunction<{ convite: Convite }>("buscar-convite", { busca });
  return convite;
}

export async function confirmarPresenca(
  convidadoId: string,
  confirmacoes: Partial<Pick<Pessoa, "confirmou_cerimonia" | "confirmou_festa" | "confirmou_after">>
) {
  const { convidado } = await callFunction<{ convidado: Pessoa }>("confirmar-presenca", {
    convidado_id: convidadoId,
    ...confirmacoes,
  });
  return convidado;
}
