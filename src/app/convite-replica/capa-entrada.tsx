"use client";

import { useEffect, useRef, useState } from "react";
import { mesmoNome, normalizarNome } from "@/lib/nome-convidado";
import { buscarConvite, ErroFuncao, type Convite } from "@/lib/supabase-functions";

const CHAVE_NOME = "laura-gu:nome-checkin";
const NAO_ENCONTRADO = "Nome não encontrado na lista de convidados.";
const ERRO_REDE = "Não foi possível verificar agora. Tente de novo.";

/** 404 vira o texto do HTML; 400 e 409 mostram o texto do servidor; falha de
    rede, resposta que não é JSON ou erro do servidor viram a mensagem
    genérica. */
function mensagemDeErro(e: unknown) {
  if (e instanceof ErroFuncao) {
    if (e.status === 404) return NAO_ENCONTRADO;
    if (e.status === 400 || e.status === 409) return e.message;
  }
  return ERRO_REDE;
}

/** Campo "Nome completo" + ENTRAR da capa. A busca grava o check-in de quem
    entrou. O ENTRAR fica apagado com o campo vazio (CSS :placeholder-shown). */
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
    if (!normalizarNome(texto) || buscando) return;
    setBuscando(true);
    setErro(null);
    try {
      const convite = await buscarConvite(texto);
      // Só entra com o nome inteiro, mesmo que a função publicada ainda seja a
      // antiga (que achava por pedaço do nome).
      if (!convite.pessoas.some((p) => mesmoNome(p.nome, texto))) {
        setErro(NAO_ENCONTRADO);
        return;
      }
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
        placeholder="Nome completo"
        aria-label="Nome completo"
        maxLength={120}
        required
        readOnly={buscando}
        onChange={() => setErro(null)}
      />
      <button type="submit" className="rc-entrar" disabled={buscando}>
        ENTRAR
      </button>
    </form>
  );
}
