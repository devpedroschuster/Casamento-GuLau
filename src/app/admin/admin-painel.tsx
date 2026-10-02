"use client";

import { useEffect, useState } from "react";

type Perfil = "cerimonia_festa_after" | "festa_after";
type ChaveConfirmacao = "confirmou_cerimonia" | "confirmou_festa" | "confirmou_after";

interface PessoaStatus {
  id: string;
  nome: string;
  checkin_em: string | null;
  confirmou_cerimonia: boolean | null;
  confirmou_festa: boolean | null;
  confirmou_after: boolean | null;
  status_pagamento_after: "pendente" | "pago" | "nao_aplicavel";
}

interface ConviteStatus {
  id: string;
  nome_exibicao: string;
  perfil: Perfil;
  criado_em: string;
  convidados: PessoaStatus[];
}

const LABEL_PERFIL: Record<Perfil, string> = {
  cerimonia_festa_after: "Cerimônia + Jantar + Festa",
  festa_after: "Só Festa/After",
};

const ETAPAS_POR_PERFIL: Record<Perfil, { chave: ChaveConfirmacao; label: string }[]> = {
  cerimonia_festa_after: [
    { chave: "confirmou_cerimonia", label: "Cerimônia" },
    { chave: "confirmou_festa", label: "Festa" },
    { chave: "confirmou_after", label: "After" },
  ],
  festa_after: [
    { chave: "confirmou_festa", label: "Festa" },
    { chave: "confirmou_after", label: "After" },
  ],
};

function formatarCheckin(iso: string | null) {
  if (!iso) return "Ainda não";
  const data = new Date(iso);
  const dia = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `Fez check-in em ${dia} às ${hora}`;
}

function simboloConfirmacao(valor: boolean | null) {
  if (valor === true) return "✓";
  if (valor === false) return "✗";
  return "—";
}

export default function AdminPainel() {
  const [convites, setConvites] = useState<ConviteStatus[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState<string | null>(null);

  const [nomeExibicao, setNomeExibicao] = useState("");
  const [perfil, setPerfil] = useState<Perfil>("cerimonia_festa_after");
  const [nomes, setNomes] = useState([""]);
  const [enviando, setEnviando] = useState(false);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);

  function carregarLista() {
    setCarregando(true);
    setErroLista(null);
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
    carregarLista();
  }, []);

  function handleNomeChange(indice: number, valor: string) {
    setNomes((atual) => atual.map((n, i) => (i === indice ? valor : n)));
  }

  function handleAdicionarPessoa() {
    setNomes((atual) => [...atual, ""]);
  }

  function handleRemoverPessoa(indice: number) {
    setNomes((atual) => atual.filter((_, i) => i !== indice));
  }

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
    } catch (e) {
      setErroFormulario(e instanceof Error ? e.message : "Erro ao salvar o novo grupo");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-6 py-16 space-y-12 text-ivory">
      <h1 className="text-2xl font-display">Admin — convidados</h1>

      <form onSubmit={handleSubmit} className="space-y-4 border border-champagne/30 rounded-sm p-6">
        <h2 className="text-lg">Cadastrar novo grupo</h2>

        <div className="space-y-1">
          <label className="text-sm text-platinum/80">Nome do grupo</label>
          <input
            type="text"
            value={nomeExibicao}
            onChange={(e) => setNomeExibicao(e.target.value)}
            placeholder="Ex: Pedro Schuster e Aléxia Chaves"
            className="w-full rounded-sm border border-champagne/30 bg-white/5 px-4 py-2 text-ivory placeholder:text-platinum/40 focus:outline-none focus:ring-1 focus:ring-champagne"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-platinum/80">Lista</label>
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
          <label className="text-sm text-platinum/80">Pessoas do grupo</label>
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
                  className="px-3 text-platinum/60 hover:text-rose-gold"
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

        <button type="submit" disabled={enviando} className="btn-metal px-6 py-2 rounded-sm tracking-wide">
          {enviando ? "Salvando..." : "Cadastrar grupo"}
        </button>
      </form>

      <section className="space-y-6">
        <h2 className="text-lg">Grupos cadastrados</h2>

        {carregando && <p className="text-platinum/60">Carregando...</p>}
        {erroLista && (
          <div className="space-y-2">
            <p className="text-rose-gold text-sm">{erroLista}</p>
            <button onClick={carregarLista} className="text-sm text-champagne hover:underline">
              Tentar de novo
            </button>
          </div>
        )}

        {!carregando && !erroLista && convites.length === 0 && (
          <p className="text-platinum/60">Nenhum grupo cadastrado ainda.</p>
        )}

        {convites.map((convite) => (
          <div key={convite.id} className="border border-champagne/20 rounded-sm p-4 space-y-3">
            <div>
              <p className="font-medium">{convite.nome_exibicao}</p>
              <p className="text-xs text-platinum/60">{LABEL_PERFIL[convite.perfil]}</p>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-platinum/60">
                  <th className="font-normal pb-2">Pessoa</th>
                  <th className="font-normal pb-2">Check-in</th>
                  {ETAPAS_POR_PERFIL[convite.perfil].map((etapa) => (
                    <th key={etapa.label} className="font-normal pb-2">
                      {etapa.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {convite.convidados.map((pessoa) => (
                  <tr key={pessoa.id} className="border-t border-champagne/10">
                    <td className="py-2">{pessoa.nome}</td>
                    <td className="py-2">{formatarCheckin(pessoa.checkin_em)}</td>
                    {ETAPAS_POR_PERFIL[convite.perfil].map((etapa) => (
                      <td key={etapa.label} className="py-2">
                        {simboloConfirmacao(pessoa[etapa.chave])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>
    </main>
  );
}
