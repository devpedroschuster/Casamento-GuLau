// Edge Function: confirmar-presenca
// Atualiza a confirmação de presença de UMA pessoa (convidado_id), validando
// que ela só confirme etapas para as quais o convite (grupo) foi de fato
// convidado, com base no perfil do convite.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Perfil = "cerimonia_festa_after" | "festa_after";

const ETAPAS_POR_PERFIL: Record<Perfil, string[]> = {
  cerimonia_festa_after: ["cerimonia", "festa", "after"],
  festa_after: ["festa", "after"],
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { convidado_id, confirmou_cerimonia, confirmou_festa, confirmou_after } = await req.json();

    if (!convidado_id || typeof convidado_id !== "string") {
      return new Response(JSON.stringify({ error: "convidado_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Busca a pessoa + o perfil do convite (grupo) ao qual ela pertence
    const { data: convidado, error: fetchError } = await supabase
      .from("convidados")
      .select("id, convite_id, convites(perfil)")
      .eq("id", convidado_id)
      .single();

    if (fetchError || !convidado) {
      return new Response(JSON.stringify({ error: "Convidado não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const perfil = (convidado as unknown as { convites: { perfil: Perfil } }).convites.perfil;
    const etapasPermitidas = ETAPAS_POR_PERFIL[perfil];
    const update: Record<string, unknown> = { respondido_em: new Date().toISOString() };

    // Só grava o campo se a etapa for permitida para o perfil do convite
    if (etapasPermitidas.includes("cerimonia") && typeof confirmou_cerimonia === "boolean") {
      update.confirmou_cerimonia = confirmou_cerimonia;
    }
    if (etapasPermitidas.includes("festa") && typeof confirmou_festa === "boolean") {
      update.confirmou_festa = confirmou_festa;
    }
    if (etapasPermitidas.includes("after") && typeof confirmou_after === "boolean") {
      update.confirmou_after = confirmou_after;
      // Se confirmou o after, abre pendência de pagamento (o QR Code é exibido no client)
      update.status_pagamento_after = confirmou_after ? "pendente" : "nao_aplicavel";
    }

    const { data: updated, error: updateError } = await supabase
      .from("convidados")
      .update(update)
      .eq("id", convidado_id)
      .select(
        "id, nome, confirmou_cerimonia, confirmou_festa, confirmou_after, status_pagamento_after, valor_after, respondido_em"
      )
      .single();

    if (updateError) {
      return new Response(JSON.stringify({ error: "Erro ao salvar confirmação" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ convidado: updated }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
