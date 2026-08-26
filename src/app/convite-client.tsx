"use client";

import { useState } from "react";
import { confirmarPresenca, type Convite, type Perfil, type Pessoa } from "@/lib/supabase-functions";
import QrCodeAfter from "@/components/qr-code-after";

type EtapaKey = "confirmou_cerimonia" | "confirmou_festa" | "confirmou_after";

const ETAPAS_POR_PERFIL: Record<Perfil, { key: EtapaKey; label: string }[]> = {
  cerimonia_festa_after: [
    { key: "confirmou_cerimonia", label: "Cerimônia" },
    { key: "confirmou_festa", label: "Festa" },
    { key: "confirmou_after", label: "After" },
  ],
  festa_after: [
    { key: "confirmou_festa", label: "Festa" },
    { key: "confirmou_after", label: "After" },
  ],
};

export default function ConviteClient({
  conviteInicial,
  onTrocarNome,
}: {
  conviteInicial: Convite;
  onTrocarNome: () => void;
}) {
  const [pessoas, setPessoas] = useState<Pessoa[]>(conviteInicial.pessoas);
  const etapas = ETAPAS_POR_PERFIL[conviteInicial.perfil];

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-2">
        <p className="text-sm tracking-widest uppercase text-neutral-200">Laura & Gu</p>
        <h1 className="text-2xl font-serif text-white">Olá, {conviteInicial.nome_exibicao}!</h1>
        <p className="text-neutral-200">
          Confirme a presença de cada pessoa do grupo nas etapas para as quais foram convidados.
        </p>
      </div>

      <div className="space-y-6">
        {pessoas.map((pessoa) => (
          <PessoaCard
            key={pessoa.id}
            pessoa={pessoa}
            etapas={etapas}
            onAtualizar={(atualizada) =>
              setPessoas((prev) => prev.map((p) => (p.id === atualizada.id ? atualizada : p)))
            }
          />
        ))}
      </div>

      <button onClick={onTrocarNome} className="text-sm text-neutral-200 underline underline-offset-2">
        Não é você? Buscar outro nome
      </button>
    </div>
  );
}

function PessoaCard({
  pessoa,
  etapas,
  onAtualizar,
}: {
  pessoa: Pessoa;
  etapas: { key: EtapaKey; label: string }[];
  onAtualizar: (pessoa: Pessoa) => void;
}) {
  const [respostas, setRespostas] = useState<Partial<Record<EtapaKey, boolean>>>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const jaRespondeu = !!pessoa.respondido_em;
  const houveAlteracao = Object.keys(respostas).length > 0;

  function handleToggle(key: EtapaKey, value: boolean) {
    setRespostas((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setSalvando(true);
    setErro(null);
    try {
      const atualizada = await confirmarPresenca(pessoa.id, respostas);
      onAtualizar(atualizada);
      setRespostas({});
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar sua confirmação");
    } finally {
      setSalvando(false);
    }
  }

  const confirmouAfter = pessoa.confirmou_after ?? respostas.confirmou_after;

  return (
    <div className="space-y-4 border border-white/20 rounded-2xl p-4">
      <p className="font-serif text-lg text-white">{pessoa.nome}</p>

      {etapas.map((etapa) => {
        const valorAtual = respostas[etapa.key] ?? pessoa[etapa.key] ?? undefined;
        return (
          <div
            key={etapa.key}
            className="flex items-center justify-between border border-neutral-200 rounded-xl px-4 py-3 bg-white/95 backdrop-blur-sm"
          >
            <span className="font-medium text-neutral-800">{etapa.label}</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleToggle(etapa.key, true)}
                className={`px-3 py-1 rounded-full text-sm border transition ${
                  valorAtual === true
                    ? "bg-neutral-800 text-white border-neutral-800"
                    : "border-neutral-300 text-neutral-600"
                }`}
              >
                Vou
              </button>
              <button
                onClick={() => handleToggle(etapa.key, false)}
                className={`px-3 py-1 rounded-full text-sm border transition ${
                  valorAtual === false
                    ? "bg-neutral-800 text-white border-neutral-800"
                    : "border-neutral-300 text-neutral-600"
                }`}
              >
                Não vou
              </button>
            </div>
          </div>
        );
      })}

      {erro && <p className="text-red-300 text-sm">{erro}</p>}

      {houveAlteracao && (
        <button
          onClick={handleSubmit}
          disabled={salvando}
          className="w-full py-2.5 rounded-full bg-neutral-800 text-white font-medium disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Confirmar"}
        </button>
      )}

      {jaRespondeu && !houveAlteracao && (
        <p className="text-sm text-neutral-200">Resposta registrada. Pode alterar quando quiser.</p>
      )}

      {confirmouAfter === true && <QrCodeAfter slug={pessoa.id} valor={pessoa.valor_after} />}
    </div>
  );
}
