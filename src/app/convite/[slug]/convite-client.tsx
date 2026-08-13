"use client";

import { useState } from "react";
import { confirmarPresenca, type Convidado } from "@/lib/supabase-functions";
import QrCodeAfter from "@/components/qr-code-after";

const ETAPAS_POR_PERFIL: Record<Convidado["perfil"], { key: EtapaKey; label: string }[]> = {
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

type EtapaKey = "confirmou_cerimonia" | "confirmou_festa" | "confirmou_after";

export default function ConviteClient({ convidadoInicial }: { convidadoInicial: Convidado }) {
  const [convidado, setConvidado] = useState(convidadoInicial);
  const [respostas, setRespostas] = useState<Partial<Record<EtapaKey, boolean>>>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const etapas = ETAPAS_POR_PERFIL[convidado.perfil];
  const jaRespondeu = !!convidado.respondido_em;

  function handleToggle(key: EtapaKey, value: boolean) {
    setRespostas((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setSalvando(true);
    setErro(null);
    try {
      const atualizado = await confirmarPresenca(convidado.slug, respostas);
      setConvidado(atualizado);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar sua confirmação");
    } finally {
      setSalvando(false);
    }
  }

  const todasEtapasRespondidas = etapas.every(
    (etapa) => respostas[etapa.key] !== undefined || convidado[etapa.key] !== null
  );

  const confirmouAfter = convidado.confirmou_after ?? respostas.confirmou_after;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-[#faf7f2]">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-2">
          <p className="text-sm tracking-widest uppercase text-neutral-500">Laura & Gu</p>
          <h1 className="text-2xl font-serif text-neutral-800">Olá, {convidado.nome}!</h1>
          <p className="text-neutral-600">
            Confirme sua presença nas etapas abaixo para as quais você foi convidado(a).
          </p>
        </div>

        <div className="space-y-4">
          {etapas.map((etapa) => {
            const valorAtual = respostas[etapa.key] ?? convidado[etapa.key] ?? undefined;
            return (
              <div
                key={etapa.key}
                className="flex items-center justify-between border border-neutral-200 rounded-xl px-4 py-3 bg-white"
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
        </div>

        {erro && <p className="text-red-600 text-sm">{erro}</p>}

        {Object.keys(respostas).length > 0 && (
          <button
            onClick={handleSubmit}
            disabled={salvando}
            className="w-full py-3 rounded-full bg-neutral-800 text-white font-medium disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Confirmar presença"}
          </button>
        )}

        {jaRespondeu && Object.keys(respostas).length === 0 && (
          <p className="text-sm text-neutral-500">Sua resposta já foi registrada. Obrigado!</p>
        )}

        {confirmouAfter === true && (
          <QrCodeAfter slug={convidado.slug} valor={convidado.valor_after} />
        )}
      </div>
    </main>
  );
}
