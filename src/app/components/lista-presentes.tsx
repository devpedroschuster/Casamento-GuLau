"use client";

import { useState } from "react";
import { gerarPixQrCode, PIX_CONFIG_PADRAO } from "@/lib/pix";
import { copiarTexto } from "@/lib/clipboard";
import Cantos from "./cantos";

const formatoReal = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Cada item é só uma sugestão de valor — a pessoa pode presentear com o
    quanto puder, editando o campo ao clicar em "Presentear". Ajuste o texto
    e os valores como quiser. */
const PRESENTES = [
  { titulo: "1 ano de mensalidade do fut do noivo", valor: 419.17 },
  { titulo: "Ajuda para a aposentadoria dos noivos", valor: 878.83 },
  { titulo: "Ajuda para mobiliar a casa nova", valor: 1133.39 },
  { titulo: "Ajuda para o pacote da lua de mel", valor: 692.84 },
  { titulo: "Diária de pet sitter durante a lua de mel", valor: 418.72 },
  { titulo: "Brinde da noite de núpcias", valor: 559.42 },
  { titulo: 'Coral para cantar "Aleluia" na entrada da noiva', valor: 839.08 },
  { titulo: "Cota para perguntar quando vem o herdeiro", valor: 189.34 },
  { titulo: "Cota para reclamar que não tem pagode na festa", valor: 336.25 },
  { titulo: "Aula de dança de salão pro padrinho desengonçado", valor: 249.9 },
  { titulo: "Sapato novo pra não escorregar na pista de dança", valor: 310.5 },
  { titulo: "Gorjeta pro DJ tocar aquela música específica", valor: 275.0 },
  { titulo: "Jantar de aniversário de 1 ano de casados", valor: 450.0 },
  { titulo: "Gasolina pro carro dos noivos", valor: 210.0 },
  { titulo: "Ajuda pra pagar a fatura do cartão depois da festa", valor: 560.0 },
];

export default function ListaPresentes() {
  return (
    <section id="presentes" className="secao max-w-3xl mx-auto px-6 py-20">
      <p className="text-xs tracking-[0.35em] uppercase eyebrow-metal font-medium mb-4 text-center">
        Lista de presentes
      </p>
      <h2 className="font-display italic text-3xl mb-3 text-center">Um mimo pra gente</h2>
      <p className="text-platinum/70 text-sm text-center max-w-lg mx-auto mb-12">
        Sua presença já é o maior presente. Mas se quiser nos ajudar com algo, os valores abaixo
        são só sugestões — dá pra presentear com o quanto puder.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {PRESENTES.map((p) => (
          <PresenteCard key={p.titulo} titulo={p.titulo} valorSugerido={p.valor} />
        ))}
      </div>
    </section>
  );
}

type Estado = "fechado" | "valor" | "pix";

function PresenteCard({ titulo, valorSugerido }: { titulo: string; valorSugerido: number }) {
  const [estado, setEstado] = useState<Estado>("fechado");
  const [valorTexto, setValorTexto] = useState(valorSugerido.toFixed(2));
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [payloadPix, setPayloadPix] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function gerarPix() {
    const valor = Number(valorTexto);
    if (!valor || valor <= 0) {
      setErro("Digite um valor válido.");
      return;
    }
    setGerando(true);
    setErro(null);
    try {
      const { qrCodeDataUrl, payload } = await gerarPixQrCode({
        ...PIX_CONFIG_PADRAO,
        valor,
        identificador: titulo.slice(0, 30),
      });
      setQrCodeDataUrl(qrCodeDataUrl);
      setPayloadPix(payload);
      setEstado("pix");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao gerar o Pix");
    } finally {
      setGerando(false);
    }
  }

  async function copiarCodigoPix() {
    if (!payloadPix) return;
    const sucesso = await copiarTexto(payloadPix);
    if (sucesso) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  }

  return (
    <div className="moldura p-6 flex flex-col text-center">
      <Cantos />
      <p className="font-display italic text-lg text-ivory flex-1">{titulo}</p>

      {estado === "fechado" && (
        <>
          <p className="text-champagne-light text-xl font-display mt-3 mb-4">
            {formatoReal.format(valorSugerido)}
          </p>
          <button onClick={() => setEstado("valor")} className="btn-metal py-2 rounded-sm text-sm">
            Presentear
          </button>
        </>
      )}

      {estado === "valor" && (
        <div className="mt-3 space-y-3">
          <label className="block text-left text-[11px] tracking-widest uppercase text-platinum/50">
            Valor (R$)
          </label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={valorTexto}
            onChange={(e) => setValorTexto(e.target.value)}
            className="w-full rounded-sm border border-champagne/30 bg-white/5 backdrop-blur-sm px-4 py-2 text-ivory text-center focus:outline-none focus:ring-1 focus:ring-champagne"
          />
          {erro && <p className="text-rose-gold text-xs">{erro}</p>}
          <button
            onClick={gerarPix}
            disabled={gerando}
            className="btn-metal w-full py-2 rounded-sm text-sm disabled:opacity-60"
          >
            {gerando ? "Gerando..." : "Gerar Pix"}
          </button>
          <button
            onClick={() => setEstado("fechado")}
            className="text-xs text-platinum/50 underline underline-offset-2"
          >
            Cancelar
          </button>
        </div>
      )}

      {estado === "pix" && qrCodeDataUrl && (
        <div className="mt-3 space-y-3">
          <p className="text-champagne-light text-lg font-display">{formatoReal.format(Number(valorTexto))}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCodeDataUrl} alt="QR Code Pix" className="mx-auto w-40 h-40 rounded-sm" />
          <p className="text-platinum/60 text-xs">
            No computador, escaneie o QR Code. No celular, copie o código abaixo e cole no app do seu banco.
          </p>
          <button onClick={copiarCodigoPix} className="btn-metal w-full py-2 rounded-sm text-sm">
            {copiado ? "Código copiado!" : "Copiar código Pix"}
          </button>
          <button
            onClick={() => setEstado("valor")}
            className="text-xs text-platinum/50 underline underline-offset-2"
          >
            Escolher outro valor
          </button>
        </div>
      )}
    </div>
  );
}
