"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./convite-replica.css";
import {
  AREAS_INDICACOES,
  AREAS_MAPA,
  LUZES_ABERTURA,
  LUZES_DRESS,
  PIX_AFTER,
  PRESENTES,
  PRESENTES_TOPO,
  type AreaClicavel,
  type Luz,
} from "./dados";

const TOTAL_TELAS = 7;
const ALVO_CONTAGEM = new Date("2026-11-28T17:00:00-03:00").getTime();

/** Qual das duas imagens do After está visível (a outra fica apagada). */
type AfterAtivo = "nenhum" | "primeiro" | "segundo";

function formatarContagem(agora: number | null) {
  let diff = agora === null ? 0 : Math.max(0, ALVO_CONTAGEM - agora);
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

function Foto({
  src,
  alt,
  largura = 1024,
  altura = 1536,
  prioridade = false,
  imgRef,
  aoCarregar,
}: {
  src: string;
  alt: string;
  largura?: number;
  altura?: number;
  prioridade?: boolean;
  imgRef?: React.Ref<HTMLImageElement>;
  aoCarregar?: () => void;
}) {
  return (
    <Image
      ref={imgRef}
      src={src}
      alt={alt}
      width={largura}
      height={altura}
      unoptimized
      preload={prioridade}
      loading={prioridade ? undefined : "eager"}
      onLoad={aoCarregar}
    />
  );
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
  const [aberto, setAberto] = useState(false);
  const [atual, setAtual] = useState(0);
  const [agora, setAgora] = useState<number | null>(null);
  const [afterAberto, setAfterAberto] = useState(false);
  const [ativo, setAtivo] = useState<AfterAtivo>("nenhum");
  const [presente, setPresente] = useState<number | null>(null);
  const [statusPix, setStatusPix] = useState("");
  const [areaPix, setAreaPix] = useState<CSSProperties>({});
  const [after2Carregada, setAfter2Carregada] = useState(false);

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
    const novo = Math.max(0, Math.min(TOTAL_TELAS - 1, n));
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
    const pix = PRESENTES[indice].pix;
    setTimeout(() => copiarPresente(pix), 60);
  }

  const [dias, horas, minutos, segundos] = formatarContagem(agora);
  const dadosPresente = presente === null ? null : PRESENTES[presente];
  const classeSite = aberto ? " rc-visivel" : "";

  return (
    <div className="rc-raiz">
      {!aberto && (
        <div className="rc-capa">
          <div className="rc-capa-moldura">
            <Foto
              src="/convite/capa.jpg"
              alt="Laura e Gustavo — O Casamento"
              largura={864}
              altura={1536}
              prioridade
            />
            <svg className="rc-energia" viewBox="0 0 864 1536" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <path
                className="rc-nuvem"
                d="M165 650 C255 730 300 805 390 800 C485 795 535 690 625 665 C685 648 735 690 775 748"
              />
            </svg>
          </div>
          <button type="button" className="rc-entrar" onClick={() => setAberto(true)}>
            ENTRAR
          </button>
        </div>
      )}

      <div className={`rc-site${classeSite}`}>
        <section className="rc-pagina rc-abertura" ref={(el) => { telas.current[0] = el; }}>
          <Foto src="/convite/01-abertura.png" alt="Página 1" />
          <Luzes luzes={LUZES_ABERTURA} classe="rc-luz-abertura" />
        </section>

        <section className="rc-pagina" ref={(el) => { telas.current[1] = el; }}>
          <div className="rc-contagem" role="timer" aria-label="Contagem regressiva para o casamento">
            {[dias, horas, minutos, segundos].map((valor, i) => (
              <div className="rc-celula" key={i}>
                <span>{valor}</span>
              </div>
            ))}
          </div>
          <Foto src="/convite/02-contagem.jpg" alt="Página 2" />
        </section>

        <section className="rc-pagina" ref={(el) => { telas.current[2] = el; }}>
          {AREAS_MAPA.map((area) => (
            <Area key={area.rotulo} area={area} />
          ))}
          <Foto src="/convite/03-como-chegar.png" alt="Página 3" />
        </section>

        <section className="rc-pagina rc-dress" ref={(el) => { telas.current[3] = el; }}>
          <Luzes luzes={LUZES_DRESS} classe="rc-luz-dress" />
          <Foto src="/convite/04-dress-code.png" alt="Página 4" />
        </section>

        <section className="rc-pagina" ref={(el) => { telas.current[4] = el; }}>
          <Foto src="/convite/05-indicacoes.png" alt="Página 5" />
          {AREAS_INDICACOES.map((area) => (
            <Area key={area.rotulo} area={area} />
          ))}
        </section>

        <section className="rc-pagina" ref={(el) => { telas.current[5] = el; }}>
          {PRESENTES_TOPO.map((topo, i) => (
            <button
              key={i}
              type="button"
              className="rc-presente"
              aria-label={`Abrir Pix do presente ${i + 1}`}
              style={{ top: `${topo}%` }}
              onClick={() => abrirPresente(i)}
            />
          ))}
          <Foto src="/convite/06-presentes.png" alt="Página 6" />
        </section>

        <section className="rc-pagina" ref={(el) => { telas.current[6] = el; }}>
          <button
            type="button"
            className="rc-confirmar"
            aria-label="Confirmar presença"
            onClick={abrirAfter}
          />
          <Foto src="/convite/07-confirmar.png" alt="Página 7" />
        </section>
      </div>

      <div className={`rc-nav${classeSite}`}>
        <button type="button" aria-label="Tela anterior" onClick={() => ir(atual - 1)}>
          ‹
        </button>
        <span>
          {atual + 1} / {TOTAL_TELAS}
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
          <Foto src="/convite/after-1-confirmada.png" alt="Sua presença está confirmada" />
        </div>
        <div className={`rc-after-slide rc-after-segundo${ativo === "segundo" ? " rc-ativo" : ""}`}>
          <Foto
            src="/convite/after-2.jpg"
            alt="After"
            imgRef={imgAfter2}
            aoCarregar={() => setAfter2Carregada(true)}
          />
          <a
            className="rc-pix-area"
            aria-label="Copiar Pix do After"
            href="#"
            style={areaPix}
            onClick={(e) => {
              e.preventDefault();
              void copiarTexto(PIX_AFTER);
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
