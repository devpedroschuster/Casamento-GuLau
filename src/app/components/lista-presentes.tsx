"use client";

import { useState } from "react";
import { gerarPixQrCode, PIX_CONFIG_PADRAO } from "@/lib/pix";
import { copiarTexto } from "@/lib/clipboard";
import Cantos from "./cantos";

const formatoReal = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Os 9 itens e as frases são dos próprios noivos — só os valores são
    sugestão minha, ajustem como quiser. A pessoa pode presentear com o
    quanto puder, editando o campo ao clicar em "Presentear". */
const PRESENTES = [
  { titulo: "Cabelos para as tranças do noivo", subtitulo: "Porque até um careca merece um projeto capilar.", valor: 150.0 },
  { titulo: "Massagem para os noivos", subtitulo: "Por carregarmos o peso de fazer a melhor festa.", valor: 280.0 },
  { titulo: "Uma noite sem cozinhar", subtitulo: "Porque amor também é pedir delivery.", valor: 120.0 },
  { titulo: "Domingo de preguiça", subtitulo: "Investimento de longo prazo.", valor: 100.0 },
  { titulo: "Café da manhã de hotel", subtitulo: "Porque acordar sem fazer café é luxo.", valor: 90.0 },
  { titulo: "Um dia sem responsabilidades", subtitulo: "O presente que todo adulto merece.", valor: 200.0 },
  { titulo: "Vale deixar a vida mais gostosa", subtitulo: "Vocês escolhem como.", valor: 250.0 },
  { titulo: "Presente surpresa", subtitulo: "Porque vocês sabem que a gente vai amar.", valor: 180.0 },
  {
    titulo: "Contribuição para o nosso novo capítulo",
    subtitulo: "Para ajudar a transformar sonhos em histórias.",
    valor: 500.0,
  },
];

export default function ListaPresentes() {
  return (
    <section id="presentes" className="secao max-w-3xl mx-auto px-6 py-20">
      <p className="text-xs tracking-[0.35em] uppercase eyebrow-metal font-medium mb-4 text-center">
        Lista de presentes
      </p>
      <h2 className="font-display italic text-3xl mb-3 text-center">Um mimo pra gente</h2>
      <p className="text-platinum/70 text-sm text-center max-w-lg mx-auto mb-12">
        A verdade é que vocês já estão dando o melhor presente pra gente: estar presentes nas
        nossas vidas e nessa celebração. Mas, se ainda assim quiserem nos presentear, preparamos
        uma lista diferente — com coisas que podem ajudar.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {PRESENTES.map((p) => (
          <PresenteCard key={p.titulo} titulo={p.titulo} subtitulo={p.subtitulo} valorSugerido={p.valor} />
        ))}
      </div>
      <p className="text-platinum/60 text-sm text-center mt-12">Muito obrigado por contribuir.</p>
    </section>
  );
}

type Estado = "fechado" | "valor" | "pix";

function PresenteCard({
  titulo,
  subtitulo,
  valorSugerido,
}: {
  titulo: string;
  subtitulo: string;
  valorSugerido: number;
}) {
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
      <div className="flex-1">
        <p className="font-display italic text-lg text-ivory">{titulo}</p>
        <p className="text-platinum/60 text-xs italic mt-2">{subtitulo}</p>
      </div>

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
