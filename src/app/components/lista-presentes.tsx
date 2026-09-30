"use client";

import { useState, type ComponentType } from "react";
import { gerarPixQrCode, PIX_CONFIG_PADRAO } from "@/lib/pix";
import { copiarTexto } from "@/lib/clipboard";
import Cantos from "./cantos";
import FundoFoto from "./fundo-foto";
import {
  IconeTrancas,
  IconeMassagem,
  IconeSushi,
  IconeTacas,
  IconeMoedas,
  IconePilula,
  IconePoltrona,
  IconeFerramentas,
  IconePresenteIcone,
} from "./icones-presentes";

const formatoReal = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Lista final dos noivos — valor fixo por item (sem edição pelo convidado). */
const PRESENTES = [
  { titulo: "Cabelos para as tranças do noivo", subtitulo: "Porque até um careca merece um projeto capilar.", valor: 199.99, Icone: IconeTrancas },
  {
    titulo: "Massagem para as dores nas costas",
    subtitulo: "Porque carregar o peso de fazer o casamento mais inovador não é para qualquer coluna.",
    valor: 450.0,
    Icone: IconeMassagem,
  },
  {
    titulo: "Duas sequências premium de sushi",
    subtitulo: "Pros noivos que só conhecem a sequência promocional de meio de semana.",
    valor: 380.0,
    Icone: IconeSushi,
  },
  {
    titulo: "Bebi todas e me perdi",
    subtitulo: "Porque encontrar o caminho de volta era fácil. Difícil foi encontrar onde foram parar os R$ 3.000.",
    valor: 3000.0,
    Icone: IconeTacas,
  },
  {
    titulo: "Os únicos pilas que tinha na conta",
    subtitulo: "Porque o Pix foi enviado com fé, coragem e o aplicativo do banco tremendo na mão.",
    valor: 150.0,
    Icone: IconeMoedas,
  },
  { titulo: "Kit de sobrevivência da noiva", subtitulo: "Venvanse + trident né?!", valor: 400.0, Icone: IconePilula },
  {
    titulo: "Sessões terapêuticas para os noivos",
    subtitulo: "Porque vai ser difícil lidar com o fim desse festão.",
    valor: 500.0,
    Icone: IconePoltrona,
  },
  {
    titulo: "Maleta de ferramentas para o noivo",
    subtitulo: "Porque o Gustavo nem gosta de uma obra, né?!",
    valor: 600.0,
    Icone: IconeFerramentas,
  },
  {
    titulo: "Só pra não dizer que não dei nada",
    subtitulo: "Até porque fica feio chegar de mão abanando, né?!",
    valor: 99.9,
    Icone: IconePresenteIcone,
  },
];

export default function ListaPresentes() {
  return (
    <section id="presentes" className="secao overflow-hidden py-20">
      <FundoFoto src="/dourado/lista-presentes.png" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 texto-com-sombra">
        <p className="text-xs tracking-[0.35em] uppercase eyebrow-metal font-medium mb-4 text-center">
          Lista de presentes
        </p>
        <h2 className="font-display italic text-3xl mb-3 text-center">Presentes</h2>
        <p className="text-platinum/70 text-sm text-center max-w-lg mx-auto mb-12">
          Preparamos uma lista diferente com algumas ideias de coisas que podem ajudar.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PRESENTES.map((p) => (
            <PresenteCard key={p.titulo} titulo={p.titulo} subtitulo={p.subtitulo} valor={p.valor} Icone={p.Icone} />
          ))}
        </div>
        <div className="painel-texto max-w-md mx-auto mt-12 text-center">
          <p className="text-platinum/60 text-xs">
            Clique na opção desejada. O código Pix será copiado automaticamente — depois é só
            colar no aplicativo do seu banco e realizar o pagamento.
          </p>
          <p className="text-platinum/60 text-sm mt-3">Muito obrigado por contribuir.</p>
        </div>
      </div>
    </section>
  );
}

type Estado = "fechado" | "pix";

function PresenteCard({
  titulo,
  subtitulo,
  valor,
  Icone,
}: {
  titulo: string;
  subtitulo: string;
  valor: number;
  Icone: ComponentType<{ className?: string }>;
}) {
  const [estado, setEstado] = useState<Estado>("fechado");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function presentear() {
    setGerando(true);
    setErro(null);
    try {
      const { qrCodeDataUrl, payload } = await gerarPixQrCode({
        ...PIX_CONFIG_PADRAO,
        valor,
        identificador: titulo.slice(0, 30),
      });
      setQrCodeDataUrl(qrCodeDataUrl);
      setEstado("pix");
      const sucesso = await copiarTexto(payload);
      if (sucesso) {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao gerar o Pix");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="moldura p-6 flex flex-col text-center">
      <Cantos />
      <div className="flex-1">
        <Icone />
        <p className="font-display italic text-lg text-ivory">{titulo}</p>
        <p className="text-platinum/60 text-xs italic mt-2">{subtitulo}</p>
      </div>

      {estado === "fechado" && (
        <>
          <p className="text-champagne text-xl font-display mt-3 mb-4">{formatoReal.format(valor)}</p>
          {erro && <p className="text-rose-gold text-xs mb-2">{erro}</p>}
          <button onClick={presentear} disabled={gerando} className="btn-metal py-2 rounded-sm text-sm disabled:opacity-60">
            {gerando ? "Gerando..." : "Presentear"}
          </button>
        </>
      )}

      {estado === "pix" && qrCodeDataUrl && (
        <div className="mt-3 space-y-3">
          <p className="text-champagne text-lg font-display">{formatoReal.format(valor)}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCodeDataUrl} alt="QR Code Pix" className="mx-auto w-40 h-40 rounded-sm" />
          <p className="text-platinum/60 text-xs">
            {copiado
              ? "Código Pix copiado — agora é só colar no aplicativo do seu banco."
              : "No computador, escaneie o QR Code. No celular, cole o código no app do seu banco."}
          </p>
          <button onClick={() => setEstado("fechado")} className="text-xs text-platinum/50 underline underline-offset-2">
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
