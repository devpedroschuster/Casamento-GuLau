// Contas e filtros do /admin, separados da tela para poderem ser testados.
import type { Perfil } from "@/lib/supabase-functions";

export interface PessoaStatus {
  id: string;
  nome: string;
  checkin_em: string | null;
  confirmou_cerimonia: boolean | null;
  confirmou_festa: boolean | null;
  confirmou_after: boolean | null;
  status_pagamento_after: "pendente" | "pago" | "nao_aplicavel";
}

export interface ConviteStatus {
  id: string;
  nome_exibicao: string;
  perfil: Perfil;
  criado_em: string;
  convidados: PessoaStatus[];
}

/** Uma pessoa da lista, com o horário e o grupo (convite) dela. */
export type LinhaConvidado = PessoaStatus & { perfil: Perfil; grupo: string; tamanhoGrupo: number };

export const entrou = (p: PessoaStatus) => p.checkin_em !== null;
/** O site grava confirmou_festa = true em quem toca em "Confirmar presença". */
export const confirmou = (p: PessoaStatus) => p.confirmou_festa === true;
export const pagouAfter = (p: PessoaStatus) => p.status_pagamento_after === "pago";

/** Uma linha por pessoa, em ordem alfabética (sem diferenciar acento). */
export function linhasDosConvites(convites: ConviteStatus[]): LinhaConvidado[] {
  return convites
    .flatMap((c) =>
      c.convidados.map((p) => ({ ...p, perfil: c.perfil, grupo: c.nome_exibicao, tamanhoGrupo: c.convidados.length })),
    )
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
}

export type Contagem = { convidados: number; entraram: number; confirmaram: number; afterPago: number };

function contar(linhas: LinhaConvidado[]): Contagem {
  return {
    convidados: linhas.length,
    entraram: linhas.filter(entrou).length,
    confirmaram: linhas.filter(confirmou).length,
    afterPago: linhas.filter(pagouAfter).length,
  };
}

/** 1º horário = cerimonia_festa_after; 2º horário = festa_after. */
export function calcularResumo(linhas: LinhaConvidado[]) {
  return {
    primeiro: contar(linhas.filter((l) => l.perfil === "cerimonia_festa_after")),
    segundo: contar(linhas.filter((l) => l.perfil === "festa_after")),
    total: contar(linhas),
  };
}

export type Filtro = "todos" | "confirmaram" | "after_pago" | "falta_pagar";

export function filtrarPorSituacao(linhas: LinhaConvidado[], filtro: Filtro): LinhaConvidado[] {
  if (filtro === "confirmaram") return linhas.filter(confirmou);
  if (filtro === "after_pago") return linhas.filter(pagouAfter);
  if (filtro === "falta_pagar") return linhas.filter((l) => !pagouAfter(l));
  return linhas;
}

/** Cópia dos convites com os campos de uma pessoa trocados. */
export function substituirPessoa(
  convites: ConviteStatus[],
  id: string,
  mudanca: Partial<PessoaStatus>,
): ConviteStatus[] {
  return convites.map((c) =>
    c.convidados.some((p) => p.id === id)
      ? { ...c, convidados: c.convidados.map((p) => (p.id === id ? { ...p, ...mudanca } : p)) }
      : c,
  );
}
