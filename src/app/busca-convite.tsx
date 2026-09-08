"use client";

import { useEffect, useState } from "react";
import { buscarConvite, type Convite } from "@/lib/supabase-functions";
import ConviteClient from "./convite-client";
import InfoCarousel from "./components/info-carousel";
import Cantos from "./components/cantos";

const CHAVE_NOME = "laura-gu:nome-checkin";
const CHAVE_INFO_VISTA = "laura-gu:info-vista";

type Etapa = "checkin" | "info" | "confirmacao";

export default function BuscaConvite() {
  const [texto, setTexto] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [convite, setConvite] = useState<Convite | null>(null);
  const [etapa, setEtapa] = useState<Etapa>("checkin");
  const [carregandoInicial, setCarregandoInicial] = useState(true);

  // Ao carregar, se já houver um nome salvo de uma visita anterior, refaz o checkin automaticamente.
  useEffect(() => {
    const nomeSalvo = typeof window !== "undefined" ? localStorage.getItem(CHAVE_NOME) : null;
    if (!nomeSalvo) {
      setCarregandoInicial(false);
      return;
    }
    setTexto(nomeSalvo);
    buscarConvite(nomeSalvo)
      .then((c) => {
        setConvite(c);
        const jaViuInfo = localStorage.getItem(CHAVE_INFO_VISTA) === "1";
        setEtapa(jaViuInfo ? "confirmacao" : "info");
      })
      .catch(() => localStorage.removeItem(CHAVE_NOME))
      .finally(() => setCarregandoInicial(false));
  }, []);

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;

    setBuscando(true);
    setErro(null);
    try {
      const resultado = await buscarConvite(texto.trim());
      setConvite(resultado);
      setEtapa("info");
      localStorage.setItem(CHAVE_NOME, texto.trim());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao buscar seu nome");
      setConvite(null);
    } finally {
      setBuscando(false);
    }
  }

  function handleContinuarParaConfirmacao() {
    localStorage.setItem(CHAVE_INFO_VISTA, "1");
    setEtapa("confirmacao");
  }

  function handleTrocarNome() {
    localStorage.removeItem(CHAVE_NOME);
    localStorage.removeItem(CHAVE_INFO_VISTA);
    setConvite(null);
    setEtapa("checkin");
    setTexto("");
  }

  if (carregandoInicial) {
    return <section id="checkin" className="secao min-h-[40vh]" />;
  }

  if (convite && etapa === "info") {
    return (
      <section id="checkin" className="secao max-w-md mx-auto px-6 py-20">
        <InfoCarousel perfil={convite.perfil} onContinuar={handleContinuarParaConfirmacao} />
      </section>
    );
  }

  if (convite && etapa === "confirmacao") {
    return (
      <section id="checkin" className="secao max-w-2xl mx-auto px-6 py-20">
        <ConviteClient conviteInicial={convite} onTrocarNome={handleTrocarNome} />
      </section>
    );
  }

  return (
    <section id="checkin" className="secao max-w-md mx-auto px-6 py-20">
      <div className="moldura px-8 py-10 space-y-7 text-center">
        <Cantos />
        <div className="space-y-3">
          <p className="text-xs tracking-[0.35em] uppercase eyebrow-metal font-medium">Check-in</p>
          <h2 className="text-3xl font-display italic text-ivory">Faça seu check-in</h2>
          <p className="text-platinum/80 text-sm">
            Digite seu nome, exatamente como está no convite que você recebeu. Isso ainda não
            confirma sua presença — depois do check-in você vê as informações do seu convite e
            confirma cada etapa.
          </p>
        </div>

        <form onSubmit={handleBuscar} className="space-y-4">
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Digite seu nome"
            className="w-full rounded-sm border border-champagne/30 bg-white/5 backdrop-blur-sm px-4 py-3 text-ivory placeholder:text-platinum/40 focus:outline-none focus:ring-1 focus:ring-champagne"
            autoFocus
          />
          {erro && <p className="text-rose-gold text-sm">{erro}</p>}
          <button
            type="submit"
            disabled={buscando || !texto.trim()}
            className="btn-metal w-full py-3 rounded-sm tracking-wide"
          >
            {buscando ? "Buscando..." : "Fazer check-in"}
          </button>
        </form>
      </div>
    </section>
  );
}
