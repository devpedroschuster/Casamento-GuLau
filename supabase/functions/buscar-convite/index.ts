// Edge Function: buscar-convite
// Recebe um texto digitado pelo convidado (ex: "alexia") e retorna o(s)
// convite(s) cujo grupo tenha alguma pessoa com esse nome contendo o texto
// buscado — comparação sem acento e sem diferenciar maiúscula/minúscula.
//
// Substitui a antiga get-convidado (que buscava por slug exato).

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { busca } = await req.json();

    if (!busca || typeof busca !== "string" || normalizar(busca).length < 2) {
      return new Response(JSON.stringify({ error: "Digite pelo menos 2 letras do nome" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const buscaNormalizada = normalizar(busca);

    // Busca as pessoas cujo nome (sem acento, minúsculo) contém o texto buscado.
    // A função buscar_convidados_por_nome (RPC) faz unaccent+lower no banco.
    const { data: encontrados, error: rpcError } = await supabase.rpc("buscar_convidados_por_nome", {
      termo: buscaNormalizada,
    });

    if (rpcError) {
      return new Response(JSON.stringify({ error: "Erro ao buscar convidado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const conviteIds = [...new Set((encontrados ?? []).map((r: { convite_id: string }) => r.convite_id))];

    if (conviteIds.length === 0) {
      return new Response(JSON.stringify({ error: "Não encontramos esse nome na lista de convidados" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Se o texto bater com mais de um convite (grupo) diferente, pedimos pra
    // digitar um nome mais específico pra evitar ambiguidade.
    if (conviteIds.length > 1) {
      return new Response(
        JSON.stringify({ error: "Encontramos mais de uma pessoa com esse nome. Digite o nome completo." }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const conviteId = conviteIds[0];

    const { data: convite, error: conviteError } = await supabase
      .from("convites")
      .select("id, nome_exibicao, perfil")
      .eq("id", conviteId)
      .single();

    if (conviteError || !convite) {
      return new Response(JSON.stringify({ error: "Convite não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pessoas, error: pessoasError } = await supabase
      .from("convidados")
      .select(
        "id, nome, confirmou_cerimonia, confirmou_festa, confirmou_after, status_pagamento_after, valor_after, respondido_em"
      )
      .eq("convite_id", conviteId)
      .order("nome");

    if (pessoasError) {
      return new Response(JSON.stringify({ error: "Erro ao buscar convidados do grupo" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        convite: {
          id: convite.id,
          nome_exibicao: convite.nome_exibicao,
          perfil: convite.perfil,
          pessoas,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
