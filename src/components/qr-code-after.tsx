"use client";

import { useEffect, useState } from "react";
import { gerarPixQrCode } from "@/lib/pix";

// Dados fixos do recebedor do Pix — ajustar quando definirem a chave real
const PIX_CONFIG = {
  chavePix: process.env.NEXT_PUBLIC_PIX_KEY || "chave-pix-a-definir",
  nomeRecebedor: process.env.NEXT_PUBLIC_PIX_NOME || "Laura e Gu",
  cidadeRecebedor: process.env.NEXT_PUBLIC_PIX_CIDADE || "PORTO ALEGRE",
};

// Valor padrão do after, usado caso o convidado não tenha um valor específico no banco.
const VALOR_AFTER_PADRAO = Number(process.env.NEXT_PUBLIC_VALOR_AFTER_PADRAO || "0");

export default function QrCodeAfter({ slug, valor }: { slug: string; valor: number | null }) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const valorFinal = valor ?? VALOR_AFTER_PADRAO;

  useEffect(() => {
    if (!valorFinal) {
      setErro("Valor do after ainda não foi definido. Configure NEXT_PUBLIC_VALOR_AFTER_PADRAO.");
      return;
    }
    gerarPixQrCode({
      ...PIX_CONFIG,
      valor: valorFinal,
      identificador: slug,
    })
      .then((res) => setQrCodeDataUrl(res.qrCodeDataUrl))
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao gerar QR Code"));
  }, [slug, valorFinal]);

  return (
    <div className="border border-neutral-200 rounded-xl p-6 bg-white space-y-3">
      <p className="font-medium text-neutral-800">Pagamento do After</p>
      <p className="text-sm text-neutral-600">
        Escaneie o QR Code abaixo para pagar via Pix
        {valorFinal ? ` (R$ ${valorFinal.toFixed(2)})` : ""}.
      </p>
      {erro && <p className="text-red-600 text-sm">{erro}</p>}
      {qrCodeDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrCodeDataUrl} alt="QR Code Pix" className="mx-auto w-56 h-56" />
      )}
    </div>
  );
}
