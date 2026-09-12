"use client";

import { useEffect, useState } from "react";
import { gerarPixQrCode, PIX_CONFIG_PADRAO } from "@/lib/pix";
import { copiarTexto } from "@/lib/clipboard";

// Valor padrão do after, usado caso a pessoa não tenha um valor específico no banco.
const VALOR_AFTER_PADRAO = Number(process.env.NEXT_PUBLIC_VALOR_AFTER_PADRAO || "0");

export default function QrCodeAfter({ slug, valor }: { slug: string; valor: number | null }) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [payloadPix, setPayloadPix] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const valorFinal = valor ?? VALOR_AFTER_PADRAO;

  useEffect(() => {
    if (!valorFinal) {
      setErro("Valor do after ainda não foi definido. Configure NEXT_PUBLIC_VALOR_AFTER_PADRAO.");
      return;
    }
    gerarPixQrCode({
      ...PIX_CONFIG_PADRAO,
      valor: valorFinal,
      identificador: slug,
    })
      .then((res) => {
        setQrCodeDataUrl(res.qrCodeDataUrl);
        setPayloadPix(res.payload);
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao gerar QR Code"));
  }, [slug, valorFinal]);

  async function copiarCodigoPix() {
    if (!payloadPix) return;
    const sucesso = await copiarTexto(payloadPix);
    if (sucesso) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  }

  return (
    <div className="rounded-sm border border-champagne/30 p-4 bg-ivory space-y-3">
      <p className="font-medium text-onyx">Pagamento do After</p>
      <p className="text-sm text-onyx/70">
        No computador, escaneie o QR Code. No celular, copie o código Pix e cole no app do seu
        banco
        {valorFinal ? ` (R$ ${valorFinal.toFixed(2)})` : ""}.
      </p>
      {erro && <p className="text-red-600 text-sm">{erro}</p>}
      {qrCodeDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrCodeDataUrl} alt="QR Code Pix" className="mx-auto w-48 h-48" />
      )}
      {payloadPix && (
        <button
          onClick={copiarCodigoPix}
          className="w-full rounded-sm border border-champagne/40 text-onyx text-sm py-2 hover:bg-champagne/10 transition"
        >
          {copiado ? "Código copiado!" : "Copiar código Pix"}
        </button>
      )}
    </div>
  );
}
