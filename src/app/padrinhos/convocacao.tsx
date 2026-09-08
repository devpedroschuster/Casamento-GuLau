"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import StarField, { CORES } from "@/app/components/star-field";

const WHATSAPP = "5551999714595";
const MENSAGEM = "Aceito a convocação. Terno risca de giz, anotado.";

const ENDERECO = "Quintal dos Belgas, Estr. Fazenda Conceição, 605b, Morungava, Gravataí - RS";

const MAPA = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ENDERECO)}`;

const AGENDA =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=" +
  encodeURIComponent("Casamento de Laura e Gustavo") +
  "&dates=20261128/20261129" +
  "&location=" +
  encodeURIComponent(ENDERECO) +
  "&details=" +
  encodeURIComponent(
    "Terno completo preto risca de giz, camisa branca, gravata preta, sapato social preto."
  );

const ACEITE = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(MENSAGEM)}`;

const UNIFORME = [
  { rotulo: "Traje", valor: "Terno completo, três peças" },
  { rotulo: "Cor", valor: "Preto risca de giz", amostra: true },
  { rotulo: "Camisa", valor: "Branca" },
  { rotulo: "Gravata", valor: "Preta" },
  { rotulo: "Sapato", valor: "Social preto" },
];

const PLACAS = [
  {
    src: "/padrinhos/traje-1.jpg",
    alt: "Terno preto risca de giz de três peças, com colete, camisa branca e gravata preta",
  },
  { src: "/padrinhos/traje-2.jpg", alt: "Terno risca de giz com colete e lenço no bolso" },
  { src: "/padrinhos/traje-3.jpg", alt: "Terno preto risca de giz com gravata preta e camisa branca" },
];

/* A palavra do cabeçalho, em um lugar só: ela alimenta o <h1> acessível, o
   desenho em SVG e a largura do primeiro quadro. Bodoni mede cerca de 114px
   por caixa-alta em corpo 150; essa estimativa vale só até a fonte carregar,
   quando a medida real assume. */
const PALAVRA = "CONVOCADO";
const QUADRO_INICIAL = Math.round(PALAVRA.length * 114 * 1.02);

export default function Convocacao() {
  const portaoRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const poeiraRef = useRef<HTMLCanvasElement>(null);
  const marcaRef = useRef<SVGSVGElement>(null);
  const palavraRef = useRef<SVGTextElement>(null);

  const abertoRef = useRef(false);
  const fontesProntasRef = useRef(false);
  const palavraAjustadaRef = useRef(false);

  /* A palavra sob medida: com a fonte carregada, largamos a largura forçada e
     encaixamos o viewBox no texto real. Sem isso os glifos ficam espremidos
     (8% em Bodoni, 14% se a fonte não tiver chegado) e as letras parecem
     cortadas. Só dá para medir com o documento já visível: enquanto ele está
     display:none, getComputedTextLength devolve 0. */
  const ajustarPalavra = useRef(() => {});

  useEffect(() => {
    /* Idempotente de propósito. A medida varia entre chamadas — a fonte
       variável ainda está resolvendo o eixo óptico, e o layout pode não ter
       assentado —, e uma medida curta demais faria a palavra transbordar o
       cartão. Então medimos de novo sempre que houver motivo, e o último
       valor manda. */
    ajustarPalavra.current = () => {
      const svg = marcaRef.current;
      const texto = palavraRef.current;
      if (!fontesProntasRef.current) return;
      if (!svg || !texto || !svg.getClientRects().length) return;

      texto.removeAttribute("textLength");
      texto.removeAttribute("lengthAdjust");

      const largura = texto.getComputedTextLength();
      if (!largura || !isFinite(largura)) {
        if (!palavraAjustadaRef.current) {
          texto.setAttribute("textLength", String(QUADRO_INICIAL / 1.02));
          texto.setAttribute("lengthAdjust", "spacingAndGlyphs");
        }
        return;
      }

      // 2% de folga: qualquer resto de imprecisão vira respiro dos dois lados,
      // em vez de a palavra encostar (ou vazar) na borda do cartão
      const quadro = largura * 1.02;
      svg.setAttribute("viewBox", `0 0 ${quadro} 126`);
      svg.style.aspectRatio = `${quadro} / 126`;
      texto.setAttribute("x", String(quadro / 2));
      palavraAjustadaRef.current = true;
    };

    let cancelado = false;
    const remedir = () => {
      if (!cancelado) ajustarPalavra.current();
    };
    const marcarFontes = () => {
      if (cancelado) return;
      fontesProntasRef.current = true;
      remedir();
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(marcarFontes);
    } else {
      addEventListener("load", marcarFontes);
    }
    addEventListener("resize", remedir);

    return () => {
      cancelado = true;
      removeEventListener("load", marcarFontes);
      removeEventListener("resize", remedir);
    };
  }, []);

  const estourar = (cx: number, cy: number) => {
    const pc = poeiraRef.current;
    const pctx = pc?.getContext("2d");
    if (!pc || !pctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    pc.width = innerWidth * dpr;
    pc.height = innerHeight * dpr;
    pc.style.width = `${innerWidth}px`;
    pc.style.height = `${innerHeight}px`;
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const fagulhas = Array.from({ length: 90 }, () => {
      const ang = Math.random() * Math.PI * 2;
      const v = 1.6 + Math.random() * 6.4;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(ang) * v,
        vy: Math.sin(ang) * v - 1.6,
        r: Math.random() * 2 + 0.6,
        cor: CORES[(Math.random() * CORES.length) | 0],
        vida: 1,
      };
    });

    const passo = () => {
      pctx.clearRect(0, 0, innerWidth, innerHeight);
      let vivas = 0;
      for (const f of fagulhas) {
        if (f.vida <= 0) continue;
        vivas++;
        f.x += f.vx;
        f.y += f.vy;
        f.vy += 0.14;
        f.vx *= 0.985;
        f.vida -= 0.011;
        pctx.beginPath();
        pctx.fillStyle = `rgba(${f.cor},${Math.max(f.vida, 0).toFixed(3)})`;
        pctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        pctx.fill();
      }
      if (vivas) requestAnimationFrame(passo);
      else pctx.clearRect(0, 0, innerWidth, innerHeight);
    };

    requestAnimationFrame(passo);
  };

  /* A abertura em quatro tempos: a cera cede e racha → as metades se soltam →
     a câmera atravessa a fenda → o documento assenta do outro lado.
     A pedido do casal, roda para todo mundo: esta página é um convite fechado
     entregue a um punhado de padrinhos, e a abertura é o presente. */
  const revelar = () => {
    const portao = portaoRef.current;
    const doc = docRef.current;
    const botao = botaoRef.current;
    if (abertoRef.current || !portao || !doc || !botao) return;
    abertoRef.current = true;

    const partes = doc.querySelectorAll<HTMLElement>(".surge");

    portao.classList.add("pressionado");

    setTimeout(() => {
      const r = botao.getBoundingClientRect();
      estourar(r.left + r.width / 2, r.top + r.height / 2);
      portao.classList.add("rompido");
    }, 400);

    // a aba levanta e revela a boca escura do envelope
    setTimeout(() => portao.classList.add("abrindo"), 800);

    setTimeout(() => portao.classList.add("atravessando"), 1450);

    setTimeout(() => {
      doc.hidden = false;
      ajustarPalavra.current(); // agora o SVG tem layout e pode ser medido
      // e de novo com o layout assentado, porque a primeira medida oscila
      setTimeout(() => ajustarPalavra.current(), 600);
      doc.classList.add("chegando");
      // reflow forçado em vez de requestAnimationFrame: rAF não roda em aba
      // oculta, e o documento ficaria preso em opacidade 0
      void doc.offsetWidth;
      doc.classList.add("assentando");
    }, 1750);

    setTimeout(() => {
      partes[0]?.classList.add("visivel");
      partes[1]?.classList.add("visivel");
    }, 2200);

    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            e.target.classList.add("visivel");
            obs.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px" }
    );
    partes.forEach((el, i) => {
      if (i >= 2) obs.observe(el);
    });

    setTimeout(() => portao.classList.add("saindo"), 2400);
    setTimeout(() => portao.remove(), 3700);

    // Rede de segurança: se a transição não chegar a rodar — aba oculta, o
    // navegador engasgando —, o documento tem de terminar visível de todo
    // jeito. Sem "chegando", sobra só o estado final.
    setTimeout(() => {
      doc.classList.remove("chegando");
      if (parseFloat(getComputedStyle(doc).opacity) < 0.98) {
        doc.style.transition = "none";
        doc.style.opacity = "1";
        doc.style.transform = "none";
        doc.style.filter = "none";
      }
    }, 3500);
  };

  return (
    <div className="convocacao">
      <div className="pd-fundo" aria-hidden="true" />
      <div className="lustre" aria-hidden="true" />
      <StarField className="brilho" sempreAtivo />

      <div className="portao" ref={portaoRef}>
        <div className="zoom">
          <div className="envelope">
            <div className="papel" aria-hidden="true" />
            {/* as duas dobras de baixo ficam no corpo; as de cima viajam com a aba */}
            <svg className="vincos" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true">
              <g stroke="#c9a25d" strokeWidth="0.4" fill="none" opacity="0.85">
                <path d="M0 140 L50 70" />
                <path d="M100 140 L50 70" />
              </g>
            </svg>
            <Ornamento className="ornamento-pe" />
            <div className="interior" aria-hidden="true" />

            <div className="aba" aria-hidden="true">
              <div className="aba-face">
                <svg
                  className="vincos"
                  viewBox="0 0 100 140"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <g stroke="#c9a25d" strokeWidth="0.4" fill="none" opacity="0.85">
                    <path d="M0 0 L50 70" />
                    <path d="M100 0 L50 70" />
                  </g>
                </svg>
                <div className="dizeres">
                  <p className="para">Para alguém</p>
                  <p className="especial">especial</p>
                  <Ornamento className="ornamento" />
                </div>
              </div>
            </div>

            <button
              type="button"
              className="lacre-btn"
              ref={botaoRef}
              onClick={revelar}
              aria-label="Romper o lacre e abrir a convocação"
            >
              <span className="lacre" aria-hidden="true">
                <span className="metade esq">
                  <span className="cera">
                    <Monograma />
                  </span>
                </span>
                <span className="metade dir">
                  <span className="cera">
                    <Monograma />
                  </span>
                </span>
                <span className="rachadura" />
              </span>
            </button>
          </div>
        </div>
        <p className="micro frio rotulo-base">toque para romper o lacre</p>
      </div>
      <canvas className="poeira" ref={poeiraRef} aria-hidden="true" />

      <main className="doc" ref={docRef} hidden>
        <article className="cartao">
          <b />
          <b />
          <b />
          <b />

          <header className="cabecalho surge">
            <p className="micro">Comunicado oficial &middot; Laura &amp; Gustavo</p>
            <p className="negacao">Você não foi convidado. Mas sim,</p>
            <h1 className="visualmente-oculto">{PALAVRA}</h1>
            <svg
              className="marca"
              ref={marcaRef}
              viewBox={`0 0 ${QUADRO_INICIAL} 126`}
              style={{ aspectRatio: `${QUADRO_INICIAL} / 126` }}
              aria-hidden="true"
              focusable="false"
            >
              <defs>
                <linearGradient id="pd-ouro" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#c9a25d" />
                  <stop offset=".30" stopColor="#c9a25d" />
                  <stop offset=".44" stopColor="#fff5dd" />
                  <stop offset=".54" stopColor="#ecd6a4" />
                  <stop offset=".68" stopColor="#c9a25d" />
                  <stop offset="1" stopColor="#c9a25d" />
                  <animateTransform
                    attributeName="gradientTransform"
                    type="translate"
                    values="-1.1 0; 1.1 0; 1.1 0"
                    keyTimes="0; .40; 1"
                    dur="7s"
                    begin="1.2s"
                    repeatCount="indefinite"
                  />
                </linearGradient>
              </defs>
              <text
                ref={palavraRef}
                x={QUADRO_INICIAL / 2}
                y="112"
                fontSize="150"
                textAnchor="middle"
                textLength={QUADRO_INICIAL / 1.02}
                lengthAdjust="spacingAndGlyphs"
              >
                {PALAVRA}
              </text>
            </svg>
            <hr className="fio" />
          </header>

          <section className="voz surge">
            <p>
              Ser nosso padrinho vai muito além de estar ao nosso lado no altar. É estar presente na
              nossa caminhada, celebrar nossas conquistas, apoiar nos momentos difíceis e, acima de
              tudo, compartilhar conosco a alegria de construir uma vida juntos.
            </p>
            <p className="assinatura">E queremos viver esse dia com vocês.</p>
          </section>

          <section className="bloco surge">
            <p className="micro">O uniforme</p>
            <div className="uniforme">
              <dl className="ficha">
                {UNIFORME.map((item) => (
                  <Fragmento key={item.rotulo} {...item} />
                ))}
              </dl>
              <div className="placas">
                {PLACAS.map((p) => (
                  <figure className="placa" key={p.src}>
                    {/* priority, e não lazy: o documento nasce escondido atrás
                        do lacre, e imagem preguiçosa dentro de display:none só
                        começaria a baixar depois que o padrinho rolasse até
                        ela. São 52 KB no total — melhor já estarem prontas. */}
                    <Image
                      src={p.src}
                      alt={p.alt}
                      fill
                      priority
                      sizes="(min-width: 62rem) 22rem, 60vw"
                    />
                  </figure>
                ))}
              </div>
            </div>
          </section>

          <section className="data bloco surge">
            <p className="micro">Data e local</p>
            <p className="numerais">
              28 <span>·</span> 11 <span>·</span> 2026
            </p>
            <p className="micro frio">Sábado</p>
            <p className="local">Quintal dos Belgas</p>
            <p className="endereco">
              Estr. Fazenda Conceição, 605b — Morungava
              <br />
              Gravataí, RS
            </p>
            <div className="acoes">
              <a className="btn-fio" href={MAPA} target="_blank" rel="noopener">
                Ver no mapa
              </a>
              <a className="btn-fio" href={AGENDA} target="_blank" rel="noopener">
                Salvar na agenda
              </a>
            </div>
          </section>

          <hr className="fio surge" />

          <section className="aceite surge">
            <p className="obs">Recusar não é uma opção prevista neste comunicado.</p>
            <a className="btn-ouro" href={ACEITE} target="_blank" rel="noopener">
              Aceito a convocação
            </a>
          </section>

          <footer className="rodape surge">
            <span className="lg">L&nbsp;|&nbsp;G</span>
            <p></p>
          </footer>
        </article>
      </main>
    </div>
  );
}

/** Coração em ouro — o mesmo desenho serve o lacre e os ornamentos. */
function Coracao({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 22" fill="currentColor" aria-hidden="true">
      <path d="M12 21C12 21 1.8 14.6 1.8 7.9 1.8 4.2 4.6 1.6 8 1.6c2 0 3.4 1 4 2.2.6-1.2 2-2.2 4-2.2 3.4 0 6.2 2.6 6.2 6.3C22.2 14.6 12 21 12 21Z" />
    </svg>
  );
}

/** O selo de cera: as iniciais e o coração, como no lacre impresso. */
function Monograma() {
  return (
    <span className="monograma">
      <span className="iniciais">
        L<i />G
      </span>
      <Coracao />
    </span>
  );
}

/** Filete com volutas e um coração ao centro, no gosto do convite tradicional. */
function Ornamento({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 240 34" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        <path d="M52 26h60M128 26h60" />
        <path d="M120 21.5 124.5 26 120 30.5 115.5 26Z" strokeWidth="0.9" />
        <path d="M52 26c-7 0-7-6.5-12.5-6.5-4.5 0-6.5 3.6-3.6 5.4 1.8 1.1 4.5.4 4.5-1.8 0-2.7-3.6-4.5-8-4.5" />
        <path d="M188 26c7 0 7-6.5 12.5-6.5 4.5 0 6.5 3.6 3.6 5.4-1.8 1.1-4.5.4-4.5-1.8 0-2.7 3.6-4.5 8-4.5" />
      </g>
      <g transform="translate(112.8 2) scale(0.6)" fill="currentColor">
        <path d="M12 21C12 21 1.8 14.6 1.8 7.9 1.8 4.2 4.6 1.6 8 1.6c2 0 3.4 1 4 2.2.6-1.2 2-2.2 4-2.2 3.4 0 6.2 2.6 6.2 6.3C22.2 14.6 12 21 12 21Z" />
      </g>
    </svg>
  );
}

/** Uma linha da ficha técnica: rótulo e valor, com a amostra de tecido na cor. */
function Fragmento({
  rotulo,
  valor,
  amostra,
}: {
  rotulo: string;
  valor: string;
  amostra?: boolean;
}) {
  return (
    <>
      <dt>{rotulo}</dt>
      <dd>
        {amostra && <span className="amostra" aria-hidden="true" />}
        {valor}
      </dd>
    </>
  );
}
