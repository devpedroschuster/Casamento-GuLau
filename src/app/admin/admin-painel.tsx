"use client";

import { useEffect, useState } from "react";
import { contemNome } from "@/lib/nome-convidado";
import type { Perfil } from "@/lib/supabase-functions";
import {
  calcularResumo,
  entrou,
  filtrarPorSituacao,
  linhasDosConvites,
  pagouAfter,
  substituirPessoa,
  type ConviteStatus,
  type Contagem,
  type Filtro,
  type LinhaConvidado,
  type PessoaStatus,
} from "./resumo";

const LABEL_PERFIL: Record<Perfil, string> = {
  cerimonia_festa_after: "Cerimônia + Jantar + Festa",
  festa_after: "Só Festa/After",
};

const HORARIO: Record<Perfil, string> = {
  cerimonia_festa_after: "1º horário",
  festa_after: "2º horário",
};

const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "confirmaram", rotulo: "Confirmaram" },
  { valor: "after_pago", rotulo: "After pago" },
  { valor: "falta_pagar", rotulo: "Falta pagar" },
];

function textoConfirmacao(p: PessoaStatus) {
  if (p.confirmou_festa === true) return "confirmou";
  if (p.confirmou_festa === false) return "não vai";
  return "não confirmou";
}

function TabelaResumo({ linhas }: { linhas: LinhaConvidado[] }) {
  const resumo = calcularResumo(linhas);
  const linhasTabela: [string, Contagem][] = [
    ["1º horário", resumo.primeiro],
    ["2º horário", resumo.segundo],
    ["Total", resumo.total],
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="text-xs text-platinum">
            <th className="pb-2 text-left font-normal" />
            <th className="pb-2 pl-2 text-right font-normal">Convidados</th>
            <th className="pb-2 pl-2 text-right font-normal">Entraram</th>
            <th className="pb-2 pl-2 text-right font-normal">Confirmaram</th>
            <th className="pb-2 pl-2 text-right font-normal">After pago</th>
          </tr>
        </thead>
        <tbody>
          {linhasTabela.map(([rotulo, c]) => (
            <tr
              key={rotulo}
              className={`border-t border-champagne/30${rotulo === "Total" ? " font-semibold" : ""}`}
            >
              <th scope="row" className="py-2 text-left font-[inherit] whitespace-nowrap">
                {rotulo}
              </th>
              <td className="py-2 pl-2 text-right">{c.convidados}</td>
              <td className="py-2 pl-2 text-right">{c.entraram}</td>
              <td className="py-2 pl-2 text-right">{c.confirmaram}</td>
              <td className="py-2 pl-2 text-right">{c.afterPago}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPainel() {
  const [convites, setConvites] = useState<ConviteStatus[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [salvando, setSalvando] = useState<Record<string, boolean>>({});
  const [erroAfter, setErroAfter] = useState<string | null>(null);

  const [formAberto, setFormAberto] = useState(false);
  const [nomeExibicao, setNomeExibicao] = useState("");
  const [perfil, setPerfil] = useState<Perfil>("cerimonia_festa_after");
  const [nomes, setNomes] = useState([""]);
  const [enviando, setEnviando] = useState(false);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);

  function buscarLista() {
    fetch("/api/admin/convites")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setConvites(data.convites);
      })
      .catch((e) => setErroLista(e instanceof Error ? e.message : "Erro ao carregar a lista"))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    buscarLista();
  }, []);

  // O aviso de falha ao salvar o After some sozinho.
  useEffect(() => {
    if (!erroAfter) return;
    const id = setTimeout(() => setErroAfter(null), 6000);
    return () => clearTimeout(id);
  }, [erroAfter]);

  function handleTentarDeNovo() {
    setCarregando(true);
    setErroLista(null);
    buscarLista();
  }

  // Um toque marca o After pago (presença confirmada no After); outro toque
  // desfaz. A tela muda na hora e volta atrás se a gravação falhar.
  async function alternarAfter(linha: LinhaConvidado) {
    if (salvando[linha.id]) return;
    const pago = !pagouAfter(linha);
    const anterior: Partial<PessoaStatus> = {
      confirmou_after: linha.confirmou_after,
      status_pagamento_after: linha.status_pagamento_after,
    };
    setErroAfter(null);
    setSalvando((s) => ({ ...s, [linha.id]: true }));
    setConvites((c) =>
      substituirPessoa(c, linha.id, {
        confirmou_after: pago ? true : null,
        status_pagamento_after: pago ? "pago" : "nao_aplicavel",
      }),
    );
    try {
      const res = await fetch(`/api/admin/convidados/${linha.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pago }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      setConvites((c) => substituirPessoa(c, linha.id, data.convidado));
    } catch {
      setConvites((c) => substituirPessoa(c, linha.id, anterior));
      setErroAfter(`Não foi possível salvar o After de ${linha.nome}. Tente de novo.`);
    } finally {
      setSalvando((s) => {
        const resto = { ...s };
        delete resto[linha.id];
        return resto;
      });
    }
  }

  function handleNomeChange(indice: number, valor: string) {
    setNomes((atual) => atual.map((n, i) => (i === indice ? valor : n)));
  }

  function handleAdicionarPessoa() {
    setNomes((atual) => [...atual, ""]);
  }

  function handleRemoverPessoa(indice: number) {
    setNomes((atual) => atual.filter((_, i) => i !== indice));
  }

  const podeEnviar = nomeExibicao.trim().length > 0 && nomes.some((n) => n.trim().length > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErroFormulario(null);

    try {
      const res = await fetch("/api/admin/convites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome_exibicao: nomeExibicao, perfil, nomes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");

      setConvites((atual) => [data.convite, ...atual]);
      setNomeExibicao("");
      setPerfil("cerimonia_festa_after");
      setNomes([""]);
      setFormAberto(false);
    } catch (e) {
      setErroFormulario(e instanceof Error ? e.message : "Erro ao salvar o novo grupo");
    } finally {
      setEnviando(false);
    }
  }

  const linhas = linhasDosConvites(convites);
  const visiveis = filtrarPorSituacao(linhas, filtro).filter((l) => contemNome(l.nome, busca));

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-4 py-8 sm:px-6 sm:py-16 space-y-10 text-ivory">
      <h1 className="text-2xl font-display">Admin — convidados</h1>

      {carregando && <p className="text-platinum">Carregando...</p>}
      {erroLista && (
        <div className="space-y-2">
          <p className="text-rose-gold text-sm">{erroLista}</p>
          <button onClick={handleTentarDeNovo} className="text-sm text-champagne hover:underline">
            Tentar de novo
          </button>
        </div>
      )}

      {!carregando && !erroLista && (
        <>
          <section className="space-y-3">
            <h2 className="text-lg">Resumo</h2>
            <TabelaResumo linhas={linhas} />
          </section>

          <section className="space-y-4">
            <h2 className="text-lg">
              Convidados{" "}
              <span className="text-sm text-platinum">
                ({visiveis.length} de {linhas.length})
              </span>
            </h2>

            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar convidado"
              aria-label="Buscar convidado"
              className="w-full rounded-sm border border-champagne/50 bg-white/60 px-4 py-3 text-base text-ivory placeholder:text-platinum focus:outline-none focus:ring-1 focus:ring-champagne"
            />

            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar convidados">
              {FILTROS.map((f) => (
                <button
                  key={f.valor}
                  type="button"
                  aria-pressed={filtro === f.valor}
                  onClick={() => setFiltro(f.valor)}
                  className={`min-h-10 rounded-full px-3 text-sm ${
                    filtro === f.valor ? "bg-ivory text-creme" : "border border-champagne/50 text-ivory"
                  }`}
                >
                  {f.rotulo} ({filtrarPorSituacao(linhas, f.valor).length})
                </button>
              ))}
            </div>

            {linhas.length === 0 && <p className="text-platinum">Nenhum convidado cadastrado ainda.</p>}
            {linhas.length > 0 && visiveis.length === 0 && (
              <p className="text-platinum">Ninguém encontrado com esse filtro.</p>
            )}

            <ul>
              {visiveis.map((l) => {
                const pago = pagouAfter(l);
                return (
                  <li key={l.id} className="flex items-center gap-3 border-t border-champagne/30 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{l.nome}</p>
                      <p className="text-xs text-platinum">
                        {HORARIO[l.perfil]} · {entrou(l) ? "entrou" : "não entrou"} · {textoConfirmacao(l)}
                        {l.tamanhoGrupo > 1 && ` · ${l.grupo}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-pressed={pago}
                      aria-label={`${pago ? "Desmarcar" : "Marcar"} After pago de ${l.nome}`}
                      disabled={salvando[l.id]}
                      onClick={() => alternarAfter(l)}
                      className={`min-h-11 shrink-0 rounded-sm px-3 text-sm whitespace-nowrap disabled:opacity-60 ${
                        pago ? "bg-champagne font-semibold text-onyx" : "border border-champagne text-ivory"
                      }`}
                    >
                      {salvando[l.id] ? "salvando…" : pago ? "✓ After pago" : "Marcar After pago"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      <section className="space-y-4">
        {!formAberto ? (
          <button
            type="button"
            onClick={() => setFormAberto(true)}
            className="min-h-11 text-sm text-ivory underline-offset-4 hover:underline"
          >
            + Cadastrar novo grupo
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 border border-champagne/30 rounded-sm p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg">Cadastrar novo grupo</h2>
              <button
                type="button"
                onClick={() => setFormAberto(false)}
                className="min-h-11 text-sm text-platinum hover:underline"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-platinum">Nome do grupo</label>
              <input
                type="text"
                required
                value={nomeExibicao}
                onChange={(e) => setNomeExibicao(e.target.value)}
                placeholder="Ex: Pedro Schuster e Aléxia Chaves"
                className="w-full rounded-sm border border-champagne/30 bg-white/5 px-4 py-2 text-ivory placeholder:text-platinum/40 focus:outline-none focus:ring-1 focus:ring-champagne"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-platinum">Lista</label>
              <select
                value={perfil}
                onChange={(e) => setPerfil(e.target.value as Perfil)}
                className="w-full rounded-sm border border-champagne/30 bg-white/5 px-4 py-2 text-ivory focus:outline-none focus:ring-1 focus:ring-champagne"
              >
                <option value="cerimonia_festa_after">{LABEL_PERFIL.cerimonia_festa_after}</option>
                <option value="festa_after">{LABEL_PERFIL.festa_after}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-platinum">Pessoas do grupo</label>
              {nomes.map((nome, indice) => (
                <div key={indice} className="flex gap-2">
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => handleNomeChange(indice, e.target.value)}
                    placeholder="Nome da pessoa"
                    className="flex-1 rounded-sm border border-champagne/30 bg-white/5 px-4 py-2 text-ivory placeholder:text-platinum/40 focus:outline-none focus:ring-1 focus:ring-champagne"
                  />
                  {nomes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoverPessoa(indice)}
                      className="px-3 text-platinum hover:text-rose-gold"
                    >
                      remover
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={handleAdicionarPessoa} className="text-sm text-champagne hover:underline">
                + adicionar pessoa
              </button>
            </div>

            {erroFormulario && <p className="text-rose-gold text-sm">{erroFormulario}</p>}

            <button
              type="submit"
              disabled={enviando || !podeEnviar}
              className="btn-metal px-6 py-2 rounded-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? "Salvando..." : "Cadastrar grupo"}
            </button>
          </form>
        )}
      </section>

      {erroAfter && (
        <p
          role="alert"
          className="fixed inset-x-4 bottom-4 z-10 mx-auto max-w-md rounded-full bg-onyx px-4 py-3 text-center text-sm text-creme shadow-lg"
        >
          {erroAfter}
        </p>
      )}
    </main>
  );
}
