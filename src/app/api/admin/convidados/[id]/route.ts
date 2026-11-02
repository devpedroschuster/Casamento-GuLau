import { excluirConvidado, marcarAfterPago } from "@/lib/supabase-admin";
import { jsonSeguro } from "../../json-seguro";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CARACTERES = 120;

// Botão "excluir" do /admin. O novo nome do grupo é opcional: o painel só envia
// quando ele foi editado.
export async function DELETE(request: Request, ctx: RouteContext<"/api/admin/convidados/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const nomeExibicao = typeof body?.nome_exibicao === "string" ? body.nome_exibicao.trim() : undefined;

  if (!UUID.test(id)) {
    return jsonSeguro({ error: "Convidado inválido" }, 400);
  }
  if (nomeExibicao === "") {
    return jsonSeguro({ error: "Digite o nome do grupo" }, 400);
  }
  if (nomeExibicao && nomeExibicao.length > MAX_CARACTERES) {
    return jsonSeguro({ error: `O nome do grupo pode ter no máximo ${MAX_CARACTERES} caracteres` }, 400);
  }

  try {
    const excluido = await excluirConvidado(id, nomeExibicao);
    if (!excluido) {
      return jsonSeguro({ error: "Convidado não encontrado" }, 404);
    }
    return jsonSeguro({ excluido });
  } catch (error) {
    console.error(error);
    return jsonSeguro({ error: "Erro ao excluir o convidado" }, 500);
  }
}

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
