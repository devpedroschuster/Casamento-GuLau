export type Perfil = "cerimonia_festa_after" | "festa_after";

export interface Convidado {
  slug: string;
  nome: string;
  perfil: Perfil;
  confirmou_cerimonia: boolean | null;
  confirmou_festa: boolean | null;
  confirmou_after: boolean | null;
  status_pagamento_after: "pendente" | "pago" | "nao_aplicavel";
  valor_after: number | null;
  respondido_em: string | null;
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

export async function getConvidado(slug: string) {
  const { convidado } = await callFunction<{ convidado: Convidado }>("get-convidado", { slug });
  return convidado;
}

export async function confirmarPresenca(
  slug: string,
  confirmacoes: Partial<Pick<Convidado, "confirmou_cerimonia" | "confirmou_festa" | "confirmou_after">>
) {
  const { convidado } = await callFunction<{ convidado: Convidado }>("confirmar-presenca", {
    slug,
    ...confirmacoes,
  });
  return convidado;
}
