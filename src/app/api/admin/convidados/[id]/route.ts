import { marcarAfterPago } from "@/lib/supabase-admin";
import { jsonSeguro } from "../../json-seguro";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Botão de um toque do /admin: marca (pago: true) ou desmarca (pago: false) o
// After pago de um convidado, depois que o noivo recebe o comprovante.
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/convidados/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);

  if (!UUID.test(id)) {
    return jsonSeguro({ error: "Convidado inválido" }, 400);
  }
  if (typeof body?.pago !== "boolean") {
    return jsonSeguro({ error: "Informe se o After foi pago" }, 400);
  }

  try {
    const convidado = await marcarAfterPago(id, body.pago);
    if (!convidado) {
      return jsonSeguro({ error: "Convidado não encontrado" }, 404);
    }
    return jsonSeguro({ convidado });
  } catch (error) {
    console.error(error);
    return jsonSeguro({ error: "Erro ao salvar o After" }, 500);
  }
}
