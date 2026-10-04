"use client";

import { useEffect, useRef, useState } from "react";
import { buscarConvite, type Convite } from "@/lib/supabase-functions";

const CHAVE_NOME = "laura-gu:nome-checkin";
const ERRO_REDE = "Não foi possível verificar agora. Tente de novo.";

/** O backend responde com mensagens em português (400, 404, 409, 500); falhas
    de rede ou resposta que não é JSON viram a mensagem genérica. */
function mensagemDeErro(e: unknown) {
  if (e instanceof TypeError || e instanceof SyntaxError) return ERRO_REDE;
  return e instanceof Error && e.message ? e.message : ERRO_REDE;
}

/** Campo de nome + ENTRAR da capa. A busca já grava o check-in do grupo. */
export default function CapaEntrada({ aoEntrar }: { aoEntrar: (convite: Convite) => void }) {
  const campo = useRef<HTMLInputElement>(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Preenche o nome lembrado neste aparelho, direto no elemento (sem setState).
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_NOME);
      if (salvo && campo.current && !campo.current.value) campo.current.value = salvo;
    } catch {
      // sem armazenamento: o campo fica em branco
    }
  }, []);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    const texto = campo.current?.value.trim() ?? "";
    if (!texto) {
      setErro("Digite seu nome");
      return;
    }
    setBuscando(true);
    setErro(null);
    try {
      const convite = await buscarConvite(texto);
      try {
        localStorage.setItem(CHAVE_NOME, texto);
      } catch {
        // sem armazenamento: só não lembra o nome da próxima vez
      }
      aoEntrar(convite);
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setBuscando(false);
    }
  }

  return (
    <form className="rc-entrada" onSubmit={entrar} noValidate>
      {erro && (
        <p className="rc-entrada-erro" role="alert">
          {erro}
        </p>
      )}
      <input
        ref={campo}
        className="rc-entrada-campo"
        type="text"
        name="nome"
        autoComplete="name"
        placeholder="Digite seu nome"
        aria-label="Seu nome, como está no convite"
        maxLength={120}
        disabled={buscando}
        onChange={() => setErro(null)}
      />
      <button type="submit" className="rc-entrar" disabled={buscando}>
        ENTRAR
      </button>
    </form>
  );
}
