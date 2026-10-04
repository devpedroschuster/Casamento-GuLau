"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./convite-replica.css";
import type { Convite } from "@/lib/supabase-functions";
import CapaEntrada from "./capa-entrada";
import Foto from "./foto";
import { PRESENTES_TOPO, type AreaClicavel, type Luz } from "./dados";
import { VERSAO_PRIMEIRO_HORARIO, versaoDoPerfil, type Imagem } from "./versoes";

const CAPA: Imagem = {
  src: "/convite/capa.jpg",
  largura: 864,
  altura: 1536,
  alt: "Laura e Gustavo — O Casamento",
};

/** Qual das duas imagens do After está visível (a outra fica apagada). */
type AfterAtivo = "nenhum" | "primeiro" | "segundo";

function formatarContagem(agora: number | null, alvo: number) {
  let diff = agora === null ? 0 : Math.max(0, alvo - agora);
  const dias = Math.floor(diff / 86400000);
  diff %= 86400000;
  const horas = Math.floor(diff / 3600000);
  diff %= 3600000;
  const minutos = Math.floor(diff / 60000);
  diff %= 60000;
  const segundos = Math.floor(diff / 1000);
  return [dias, horas, minutos, segundos].map((n) => String(n).padStart(2, "0"));
}

/** Copia texto; se a API de clipboard falhar, cai no execCommand como o original. */
async function copiarTexto(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const campo = document.createElement("textarea");
    campo.value = texto;
    document.body.appendChild(campo);
    campo.select();
    try {
      document.execCommand("copy");
    } catch {
      // sem permissão: o original também ignora
    }
    campo.remove();
  }
}

function Area({ area }: { area: AreaClicavel }) {
  return (
    <a
      className="rc-area"
      aria-label={area.rotulo}
      href={area.href}
      target={area.alvo}
      rel={area.rel}
      style={{
        left: `${area.esq}%`,
        top: `${area.topo}%`,
        width: `${area.larg}%`,
        height: `${area.alt}%`,
        zIndex: area.z,
      }}
    />
  );
}

function Luzes({ luzes, classe }: { luzes: Luz[]; classe: string }) {
  return luzes.map((luz, i) => (
    <span
      key={i}
      aria-hidden="true"
      className={classe}
      style={{
        left: luz.esq === undefined ? undefined : `${luz.esq}%`,
        right: luz.dir === undefined ? undefined : `${luz.dir}%`,
        top: `${luz.topo}%`,
        animationDelay: `${luz.atraso}s`,
      }}
    />
  ));
}

export default function ConviteReplica() {
  const [convite, setConvite] = useState<Convite | null>(null);
  const [atual, setAtual] = useState(0);
  const [agora, setAgora] = useState<number | null>(null);
  const [afterAberto, setAfterAberto] = useState(false);
  const [ativo, setAtivo] = useState<AfterAtivo>("nenhum");
  const [presente, setPresente] = useState<number | null>(null);
  const [statusPix, setStatusPix] = useState("");
  const [areaPix, setAreaPix] = useState<CSSProperties>({});
  const [after2Carregada, setAfter2Carregada] = useState(false);

  // Antes de entrar, o site (oculto) usa a versão do primeiro horário, então as
  // imagens já carregam durante a capa, como no original.
  const aberto = convite !== null;
  const versao = convite ? versaoDoPerfil(convite.perfil) : VERSAO_PRIMEIRO_HORARIO;
  const totalTelas = versao.telas.length;
  const alvoContagem = new Date(versao.alvoContagem).getTime();

  const telas = useRef<(HTMLElement | null)[]>([]);
  const imgAfter2 = useRef<HTMLImageElement | null>(null);
  const campoPix = useRef<HTMLTextAreaElement | null>(null);

  // Contagem regressiva ao vivo (1 tick imediato + 1 por segundo).
  useEffect(() => {
    const tick = () => setAgora(Date.now());
    const inicio = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(inicio);
      clearInterval(id);
    };
  }, []);

  // Ao entrar, o original rola para a primeira tela.
  useEffect(() => {
    if (aberto) telas.current[0]?.scrollIntoView({ behavior: "smooth" });
  }, [aberto]);

  // Sequência do After, como no original: com o overlay aberto e as duas
  // imagens apagadas, deixa o navegador pintar um quadro e acende a
  // "confirmada" (fade); 5200ms depois do clique ela apaga, e 350ms de preto
  // depois entra a tela do After.
  useEffect(() => {
    if (!afterAberto) return;
    let segundoQuadro = 0;
    const ids: number[] = [];
    const primeiroQuadro = requestAnimationFrame(() => {
      segundoQuadro = requestAnimationFrame(() => {
        setAtivo((atual) => (atual === "nenhum" ? "primeiro" : atual));
      });
    });
    ids.push(
      window.setTimeout(() => {
        setAtivo("nenhum");
        ids.push(window.setTimeout(() => setAtivo("segundo"), 350));
      }, 5200),
    );
    return () => {
      cancelAnimationFrame(primeiroQuadro);
      cancelAnimationFrame(segundoQuadro);
      ids.forEach(clearTimeout);
    };
  }, [afterAberto]);

  // Posiciona a área clicável do Pix do After sobre o botão marrom da imagem
  // (em px, a partir da imagem renderizada — igual ao original).
  useEffect(() => {
    if (!afterAberto) return;
    let quadro = 0;
    let atraso = 0;
    const posicionar = () => {
      const img = imgAfter2.current;
      if (!img) return;
      const r = img.getBoundingClientRect();
      setAreaPix({
        left: r.left + r.width * 0.595,
        top: r.top + r.height * 0.584,
        width: r.width * 0.22,
        height: r.height * 0.05,
      });
    };
    const agendar = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(posicionar);
    };
    const aoGirar = () => {
      clearTimeout(atraso);
      atraso = window.setTimeout(agendar, 100);
    };
    agendar();
    window.addEventListener("resize", agendar);
    window.addEventListener("orientationchange", aoGirar);
    return () => {
      cancelAnimationFrame(quadro);
      clearTimeout(atraso);
      window.removeEventListener("resize", agendar);
      window.removeEventListener("orientationchange", aoGirar);
    };
  }, [afterAberto, after2Carregada]);

  // Esc fecha o modal Pix.
  useEffect(() => {
    if (presente === null) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPresente(null);
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [presente]);

  function ir(n: number) {
    const novo = Math.max(0, Math.min(totalTelas - 1, n));
    setAtual(novo);
    telas.current[novo]?.scrollIntoView({ behavior: "smooth" });
  }

  function abrirAfter() {
    setAtivo("nenhum");
    setAfterAberto(true);
  }

  function fecharAfter() {
    setAfterAberto(false);
    setAtivo("nenhum");
  }

  async function copiarPresente(pix: string) {
    try {
      await navigator.clipboard.writeText(pix);
      setStatusPix("Pix Copia e Cola copiado. Agora é só colar no aplicativo do seu banco.");
    } catch {
      campoPix.current?.focus();
      campoPix.current?.select();
      try {
        document.execCommand("copy");
        setStatusPix("Pix Copia e Cola copiado.");
      } catch {
        setStatusPix("Selecione o código acima e copie manualmente.");
      }
    }
  }

  function abrirPresente(indice: number) {
    setPresente(indice);
    setStatusPix("");
    const pix = versao.presentes[indice].pix;
    setTimeout(() => copiarPresente(pix), 60);
  }

  const [dias, horas, minutos, segundos] = formatarContagem(agora, alvoContagem);
  const dadosPresente = presente === null ? null : versao.presentes[presente];
  const classeSite = aberto ? " rc-visivel" : "";

  return (
    <div className="rc-raiz">
      {!aberto && (
        <div className="rc-capa">
          <div className="rc-capa-moldura">
            <Foto imagem={CAPA} prioridade />
            <svg className="rc-energia" viewBox="0 0 864 1536" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <path
                className="rc-nuvem"
                d="M165 650 C255 730 300 805 390 800 C485 795 535 690 625 665 C685 648 735 690 775 748"
              />
            </svg>
          </div>
          <CapaEntrada aoEntrar={setConvite} />
        </div>
      )}

      <div className={`rc-site${classeSite}`}>
        {versao.telas.map((tela, i) => (
          <section
            key={tela.imagem.src}
            className={`rc-pagina${tela.classe ? ` ${tela.classe}` : ""}`}
            ref={(el) => {
              telas.current[i] = el;
            }}
          >
            {tela.luzes && <Luzes luzes={tela.luzes.luzes} classe={tela.luzes.classe} />}
            {tela.contagem && (
              <div className="rc-contagem" role="timer" aria-label="Contagem regressiva para o casamento">
                {[dias, horas, minutos, segundos].map((valor, k) => (
                  <div className="rc-celula" key={k}>
                    <span>{valor}</span>
                  </div>
                ))}
              </div>
            )}
            {tela.areas?.map((area) => <Area key={area.rotulo} area={area} />)}
            {tela.presentes &&
              PRESENTES_TOPO.map((topo, k) => (
                <button
                  key={k}
                  type="button"
                  className="rc-presente"
                  aria-label={`Abrir Pix do presente ${k + 1}`}
                  style={{ top: `${topo}%` }}
                  onClick={() => abrirPresente(k)}
                />
              ))}
            {tela.confirmar && (
              <button
                type="button"
                className="rc-confirmar"
                aria-label="Confirmar presença"
                onClick={abrirAfter}
              />
            )}
            <Foto imagem={tela.imagem} />
          </section>
        ))}
      </div>

      <div className={`rc-nav${classeSite}`}>
        <button type="button" aria-label="Tela anterior" onClick={() => ir(atual - 1)}>
          ‹
        </button>
        <span>
          {atual + 1} / {totalTelas}
        </span>
        <button type="button" aria-label="Próxima tela" onClick={() => ir(atual + 1)}>
          ›
        </button>
      </div>

      <div className={`rc-after${afterAberto ? " rc-visivel" : ""}`}>
        <button type="button" className="rc-voltar" onClick={fecharAfter}>
          ← Voltar
        </button>
        <div className={`rc-after-slide rc-after-primeiro${ativo === "primeiro" ? " rc-ativo" : ""}`}>
          <Foto imagem={versao.afterConfirmada} />
        </div>
        <div className={`rc-after-slide rc-after-segundo${ativo === "segundo" ? " rc-ativo" : ""}`}>
          <Foto imagem={versao.after} imgRef={imgAfter2} aoCarregar={() => setAfter2Carregada(true)} />
          <a
            className="rc-pix-area"
            aria-label="Copiar Pix do After"
            href="#"
            style={areaPix}
            onClick={(e) => {
              e.preventDefault();
              void copiarTexto(versao.pixAfter);
            }}
          />
        </div>
      </div>

      <div
        className={`rc-pix-modal${presente !== null ? " rc-mostrar" : ""}`}
        aria-hidden={presente === null}
        onClick={(e) => {
          if (e.target === e.currentTarget) setPresente(null);
        }}
      >
        <div className="rc-pix-card" role="dialog" aria-modal="true" aria-labelledby="rc-pix-titulo">
          <h3 id="rc-pix-titulo">PRESENTE SELECIONADO</h3>
          <div className="rc-pix-nome">{dadosPresente?.nome}</div>
          <div className="rc-pix-valor">{dadosPresente?.valor}</div>
          <textarea ref={campoPix} readOnly aria-label="Pix Copia e Cola" value={dadosPresente?.pix ?? ""} />
          <div className="rc-pix-acoes">
            <button
              type="button"
              className="rc-pix-copiar"
              onClick={() => dadosPresente && copiarPresente(dadosPresente.pix)}
            >
              COPIAR PIX
            </button>
            <button type="button" className="rc-pix-fechar" onClick={() => setPresente(null)}>
              FECHAR
            </button>
          </div>
          <div className="rc-pix-status">{statusPix}</div>
        </div>
      </div>
    </div>
  );
}
