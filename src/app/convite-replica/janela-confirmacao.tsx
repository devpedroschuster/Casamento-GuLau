"use client";

import { useEffect, useState } from "react";
import { confirmarPresenca, type Perfil, type Pessoa } from "@/lib/supabase-functions";

function juntarNomes(nomes: string[]) {
  if (nomes.length <= 1) return nomes.join("");
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

/** Janela aberta pelo botão "Confirmar presença" da tela 7: uma caixa por
    pessoa do grupo (marcada = vai, desmarcada = não vai). Monta a cada
    abertura, então o estado inicial reflete o que já foi gravado. */
export default function JanelaConfirmacao({
  pessoas,
  perfil,
  aoGravar,
  aoConcluir,
  aoFechar,
}: {
  pessoas: Pessoa[];
  perfil: Perfil;
  aoGravar: (gravadas: Pessoa[]) => void;
  aoConcluir: () => void;
  aoFechar: () => void;
}) {
  const [marcadas, setMarcadas] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(pessoas.map((p) => [p.id, p.confirmou_festa !== false])),
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const algumaMarcada = pessoas.some((p) => marcadas[p.id]);

  // Esc fecha, exceto enquanto grava.
  useEffect(() => {
    if (salvando) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [salvando, aoFechar]);

  async function confirmar() {
    setSalvando(true);
    setErro(null);
    const incluiCerimonia = perfil === "cerimonia_festa_after";
    const resultados = await Promise.allSettled(
      pessoas.map((p) => {
        const vai = marcadas[p.id] === true;
        return confirmarPresenca(p.id, {
          ...(incluiCerimonia ? { confirmou_cerimonia: vai } : {}),
          confirmou_festa: vai,
        });
      }),
    );
    const gravadas: Pessoa[] = [];
    const falhas: string[] = [];
    resultados.forEach((r, i) => {
      if (r.status === "fulfilled") gravadas.push(r.value);
      else falhas.push(pessoas[i].nome);
    });
    if (gravadas.length > 0) aoGravar(gravadas);
    if (falhas.length === 0) {
      aoConcluir();
      return;
    }
    setErro(`Não conseguimos salvar a confirmação de ${juntarNomes(falhas)}. Tente de novo.`);
    setSalvando(false);
  }

  return (
    <div
      className="rc-pix-modal rc-mostrar"
      onClick={(e) => {
        if (e.target === e.currentTarget && !salvando) aoFechar();
      }}
    >
      <div className="rc-pix-card" role="dialog" aria-modal="true" aria-labelledby="rc-confirma-titulo">
        <h3 id="rc-confirma-titulo">CONFIRMAR PRESENÇA</h3>
        <p className="rc-confirma-apoio">Desmarque quem não vai.</p>
        <ul className="rc-confirma-lista">
          {pessoas.map((p) => (
            <li key={p.id}>
              <label className="rc-confirma-linha">
                <input
                  type="checkbox"
                  checked={marcadas[p.id] === true}
                  disabled={salvando}
                  onChange={(e) => setMarcadas((m) => ({ ...m, [p.id]: e.target.checked }))}
                />
                <span>{p.nome}</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="rc-pix-acoes">
          <button
            type="button"
            className="rc-pix-copiar"
            disabled={salvando || !algumaMarcada}
            onClick={confirmar}
          >
            {salvando ? "SALVANDO..." : "CONFIRMAR"}
          </button>
          <button type="button" className="rc-pix-fechar" disabled={salvando} onClick={aoFechar}>
            FECHAR
          </button>
        </div>
        <div className="rc-pix-status" role="alert">
          {erro}
        </div>
      </div>
    </div>
  );
}
