"use client";

import { useState } from "react";
import { confirmarPresenca, type Convite, type Perfil, type Pessoa } from "@/lib/supabase-functions";
import QrCodeAfter from "@/components/qr-code-after";

type EtapaKey = "confirmou_cerimonia" | "confirmou_festa" | "confirmou_after";

const ETAPAS_POR_PERFIL: Record<Perfil, { key: EtapaKey; label: string; descricao: string; pago: boolean }[]> = {
  cerimonia_festa_after: [
    { key: "confirmou_cerimonia", label: "Cerimônia", descricao: "Acesso à cerimônia de casamento.", pago: false },
    { key: "confirmou_festa", label: "Festa", descricao: "Acesso à recepção e festa.", pago: false },
    { key: "confirmou_after", label: "After", descricao: "Acesso ao after — pagamento via Pix.", pago: true },
  ],
  festa_after: [
    { key: "confirmou_festa", label: "Festa", descricao: "Acesso à recepção e festa.", pago: false },
    { key: "confirmou_after", label: "After", descricao: "Acesso ao after — pagamento via Pix.", pago: true },
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
    <div className="space-y-10 text-center">
      <div className="space-y-2">
        <p className="text-xs tracking-[0.35em] uppercase eyebrow-metal font-medium">Seus ingressos</p>
        <h2 className="text-3xl font-display italic text-ivory">Olá, {conviteInicial.nome_exibicao}!</h2>
        <p className="text-platinum/80 text-sm">
          Confirme, para cada pessoa do grupo, presença nas etapas para as quais foram convidados.
        </p>
      </div>

      <div className="space-y-8">
        {pessoas.map((pessoa) => (
          <PessoaTickets
            key={pessoa.id}
            pessoa={pessoa}
            etapas={etapas}
            onAtualizar={(atualizada) =>
              setPessoas((prev) => prev.map((p) => (p.id === atualizada.id ? atualizada : p)))
            }
          />
        ))}
      </div>

      <button onClick={onTrocarNome} className="text-sm text-platinum/70 underline underline-offset-2 hover:text-champagne-light transition">
        Não é você? Buscar outro nome
      </button>
    </div>
  );
}

function PessoaTickets({
  pessoa,
  etapas,
  onAtualizar,
}: {
  pessoa: Pessoa;
  etapas: { key: EtapaKey; label: string; descricao: string; pago: boolean }[];
  onAtualizar: (pessoa: Pessoa) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="font-display italic text-xl text-ivory">{pessoa.nome}</p>
      <div className="grid gap-3">
        {etapas.map((etapa) => (
          <TicketCard key={etapa.key} pessoa={pessoa} etapa={etapa} onAtualizar={onAtualizar} />
        ))}
      </div>
    </div>
  );
}

function TicketCard({
  pessoa,
  etapa,
  onAtualizar,
}: {
  pessoa: Pessoa;
  etapa: { key: EtapaKey; label: string; descricao: string; pago: boolean };
  onAtualizar: (pessoa: Pessoa) => void;
}) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const valorAtual = pessoa[etapa.key];
  const jaConfirmou = valorAtual === true;
  const jaRecusou = valorAtual === false;
  const indefinido = valorAtual === null || valorAtual === undefined;

  async function responder(valor: boolean) {
    setSalvando(true);
    setErro(null);
    try {
      const atualizada = await confirmarPresenca(pessoa.id, { [etapa.key]: valor } as Partial<Pessoa>);
      onAtualizar(atualizada);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar sua confirmação");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="moldura p-5 text-left">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display italic text-lg text-champagne-light">{etapa.label}</h3>
            {etapa.pago && (
              <span className="text-[10px] tracking-widest uppercase text-rose-gold border border-rose-gold/40 rounded-sm px-2 py-0.5">
                Pago
              </span>
            )}
          </div>
          <p className="text-platinum/70 text-sm">{etapa.descricao}</p>
        </div>

        <div className="shrink-0">
          {jaConfirmou && (
            <span className="text-[11px] tracking-widest uppercase text-champagne-light">Confirmado</span>
          )}
          {jaRecusou && (
            <span className="text-[11px] tracking-widest uppercase text-platinum/50">Não vai</span>
          )}
        </div>
      </div>

      {erro && <p className="text-rose-gold text-sm mt-3">{erro}</p>}

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => responder(true)}
          disabled={salvando || jaConfirmou}
          className={`flex-1 py-2 rounded-sm text-sm transition ${
            jaConfirmou ? "btn-metal opacity-70 cursor-default" : "btn-metal"
          }`}
        >
          {indefinido || jaRecusou ? "Confirmar presença" : "Confirmado"}
        </button>
        <button
          onClick={() => responder(false)}
          disabled={salvando || jaRecusou}
          className={`px-4 py-2 rounded-sm text-sm border transition ${
            jaRecusou ? "border-rose-gold/60 text-rose-gold" : "border-platinum/30 text-platinum/70"
          }`}
        >
          Não vou
        </button>
      </div>

      {etapa.pago && jaConfirmou && (
        <div className="mt-4">
          <QrCodeAfter slug={pessoa.id} valor={pessoa.valor_after} />
        </div>
      )}
    </div>
  );
}
