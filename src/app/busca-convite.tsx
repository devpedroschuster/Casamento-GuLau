"use client";

import { useState } from "react";
import { buscarConvite, type Convite } from "@/lib/supabase-functions";
import ConviteClient from "./convite-client";

export default function BuscaConvite() {
  const [texto, setTexto] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [convite, setConvite] = useState<Convite | null>(null);

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;

    setBuscando(true);
    setErro(null);
    try {
      const resultado = await buscarConvite(texto.trim());
      setConvite(resultado);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao buscar seu nome");
      setConvite(null);
    } finally {
      setBuscando(false);
    }
  }

  if (convite) {
    return <ConviteClient conviteInicial={convite} onTrocarNome={() => setConvite(null)} />;
  }

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <p className="text-sm tracking-widest uppercase text-neutral-200">Laura & Gu</p>
        <h1 className="text-2xl font-serif text-white">Confirme sua presença</h1>
        <p className="text-neutral-200">
          Digite seu nome, exatamente como está no convite que você recebeu.
        </p>
      </div>

      <form onSubmit={handleBuscar} className="space-y-3">
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Digite seu nome"
          className="w-full rounded-xl border border-neutral-200 bg-white/95 backdrop-blur-sm px-4 py-3 text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-800"
          autoFocus
        />
        {erro && <p className="text-red-300 text-sm">{erro}</p>}
        <button
          type="submit"
          disabled={buscando || !texto.trim()}
          className="w-full py-3 rounded-full bg-neutral-800 text-white font-medium disabled:opacity-50"
        >
          {buscando ? "Buscando..." : "Buscar"}
        </button>
      </form>
    </div>
  );
}
