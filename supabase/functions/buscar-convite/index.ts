// Edge Function: buscar-convite
// Recebe o nome digitado pelo convidado na capa do site e devolve o convite
// (grupo) da pessoa cujo nome completo é IGUAL ao digitado — sem diferenciar
// acento, maiúscula/minúscula e espaços extras. Pedaço de nome não entra.
//
// Check-in: grava checkin_em só na pessoa cujo nome bateu (quem de fato
// entrou), na primeira vez.
//
// É publicada como um arquivo só: normalizarNome é a mesma regra de
// src/lib/nome-convidado.ts — se mudar uma, mude a outra.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COLUNAS_PESSOA =
  "id, nome, checkin_em, confirmou_cerimonia, confirmou_festa, confirmou_after, status_pagamento_after, valor_after, respondido_em";

function normalizarNome(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function responder(corpo: unknown, status: number) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { busca } = await req.json();
    const nomeBuscado = typeof busca === "string" ? normalizarNome(busca) : "";

    if (!nomeBuscado) {
      return responder({ error: "Digite seu nome completo" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // A lista tem poucas centenas de pessoas (o Supabase devolve até 1000
    // linhas por consulta): lê todos os nomes e compara aqui, com a mesma
    // normalização do site.
    const { data: todos, error: listaError } = await supabase
      .from("convidados")
      .select("id, convite_id, nome")
      .limit(5000);

    if (listaError) {
      return responder({ error: "Erro ao buscar convidado" }, 500);
    }

    const quemBateu = (todos ?? []).filter((p) => normalizarNome(p.nome) === nomeBuscado);
    const conviteIds = [...new Set(quemBateu.map((p) => p.convite_id))];

    if (conviteIds.length === 0) {
      return responder({ error: "Nome não encontrado na lista de convidados." }, 404);
    }

    // Só acontece se o mesmo nome estiver em dois convites (a importação e o
    // /admin impedem isso).
    if (conviteIds.length > 1) {
      return responder({ error: "Há mais de um convidado com esse nome. Fale com os noivos." }, 409);
    }

    const conviteId = conviteIds[0];

    const { data: convite, error: conviteError } = await supabase
      .from("convites")
      .select("id, nome_exibicao, perfil")
      .eq("id", conviteId)
      .single();

    if (conviteError || !convite) {
      return responder({ error: "Convite não encontrado" }, 404);
    }

    const { data: pessoas, error: pessoasError } = await supabase
      .from("convidados")
      .select(COLUNAS_PESSOA)
      .eq("convite_id", conviteId)
      .order("nome");

    if (pessoasError) {
      return responder({ error: "Erro ao buscar convidados do grupo" }, 500);
    }

    // Check-in só de quem entrou: a pessoa cujo nome bateu, na primeira vez.
    // Nunca bloqueia a resposta ao convidado se a gravação falhar.
    const agora = new Date().toISOString();
    const idsQueEntraram = new Set(quemBateu.map((p) => p.id));
    const idsSemCheckin = pessoas
      .filter((p) => idsQueEntraram.has(p.id) && !p.checkin_em)
      .map((p) => p.id);

    if (idsSemCheckin.length > 0) {
      const { error: checkinError } = await supabase
        .from("convidados")
        .update({ checkin_em: agora })
        .in("id", idsSemCheckin);

      if (checkinError) {
        console.error("Erro ao gravar check-in:", checkinError.message);
      } else {
        for (const p of pessoas) {
          if (idsSemCheckin.includes(p.id)) p.checkin_em = agora;
        }
      }
    }

    return responder(
      {
        convite: {
          id: convite.id,
          nome_exibicao: convite.nome_exibicao,
          perfil: convite.perfil,
          pessoas,
        },
      },
      200
    );
  } catch {
    return responder({ error: "Erro inesperado" }, 500);
  }
});
