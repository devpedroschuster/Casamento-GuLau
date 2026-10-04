"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { criarSprite } from "./star-field";

const CORES = ["255,236,180", "255,255,255", "232,220,200", "255,213,140"];

/** Pontinho redondo e suave, como as luzes fora de foco do vídeo de referência
    dos noivos. Desenhado uma única vez por cor. */
function criarPonto(cor: string) {
  const S = 48;
  const meio = S / 2;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d");
  if (!g) return c;

  const luz = g.createRadialGradient(meio, meio, 0, meio, meio, meio);
  luz.addColorStop(0, "rgba(255,255,255,0.95)");
  luz.addColorStop(0.3, `rgba(${cor},0.6)`);
  luz.addColorStop(0.7, `rgba(${cor},0.14)`);
  luz.addColorStop(1, `rgba(${cor},0)`);
  g.fillStyle = luz;
  g.fillRect(0, 0, S, S);

  return c;
}

type Particula = {
  estrela: boolean;
  cor: number;
  x: number;
  y: number;
  tam: number;
  vel: number;
  fase: number;
  balanco: number;
  freqBalanco: number;
  freqBrilho: number;
};

/** Sorteia um x com mais chance nas laterais do que no meio da tela, pra
    sobrar uma faixa central mais limpa onde o texto costuma ficar. */
function xComBordaPreferida(largura: number) {
  if (Math.random() < 0.7) {
    const lado = Math.random() < 0.5 ? 0 : 1;
    const faixa = largura * 0.3;
    return lado === 0 ? Math.random() * faixa : largura - Math.random() * faixa;
  }
  return Math.random() * largura;
}

/** Chuva de brilho — estrelas de quatro pontas e pontinhos de luz caindo
    devagar, com um leve piscar e balanço. Fica na frente do conteúdo (para
    aparecer em qualquer seção, mesmo as com foto/card por baixo), sempre atrás
    do menu fixo e sem nunca bloquear cliques; mais fraca no centro, onde fica o
    texto. Não aparece na convocação dos padrinhos, no painel /admin, nem para
    quem prefere menos movimento. */
export default function ChuvaBrilho() {
  const pathname = usePathname();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (pathname?.startsWith("/padrinhos") || pathname?.startsWith("/admin")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;

    const estrelas = CORES.map(criarSprite);
    const pontos = CORES.map(criarPonto);
    let particulas: Particula[] = [];
    let quadro = 0;
    let ultimoT = 0;

    const nova = (y: number): Particula => {
      const estrela = Math.random() < 0.55;
      const escala = innerWidth < 640 ? 0.8 : 1;
      return {
        estrela,
        cor: (Math.random() * CORES.length) | 0,
        x: xComBordaPreferida(innerWidth),
        y,
        tam: (estrela ? 16 + Math.random() * 16 : 7 + Math.random() * 10) * escala,
        vel: 10 + Math.random() * 22,
        fase: Math.random() * Math.PI * 2,
        balanco: 3 + Math.random() * 7,
        freqBalanco: 0.25 + Math.random() * 0.35,
        freqBrilho: 0.5 + Math.random() * 0.9,
      };
    };

    const dimensionar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = innerWidth * dpr;
      cv.height = innerHeight * dpr;
      cv.style.width = `${innerWidth}px`;
      cv.style.height = `${innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const n = Math.min(Math.round((innerWidth * innerHeight) / 9000), 80);
      particulas = Array.from({ length: n }, () => nova(Math.random() * innerHeight));
    };

    const pintar = (t: number) => {
      const dt = ultimoT ? Math.min((t - ultimoT) / 1000, 0.05) : 0;
      ultimoT = t;
      const s = t / 1000;
      const centro = innerWidth / 2;

      ctx.clearRect(0, 0, innerWidth, innerHeight);

      for (const p of particulas) {
        p.y += p.vel * dt;
        if (p.y - p.tam > innerHeight) {
          Object.assign(p, nova(-p.tam));
        }

        const x = p.x + Math.sin(s * p.freqBalanco + p.fase) * p.balanco;
        const brilho = 0.5 + 0.5 * Math.sin(s * p.freqBrilho + p.fase * 1.7);
        const distCentro = Math.abs(x - centro) / centro;
        const borda = 0.4 + 0.6 * Math.min(1, distCentro * 1.6);

        ctx.globalAlpha = (p.estrela ? 0.3 + 0.55 * brilho : 0.22 + 0.33 * brilho) * borda;
        const tam = p.estrela ? p.tam * (0.85 + 0.25 * brilho) : p.tam;
        ctx.drawImage((p.estrela ? estrelas : pontos)[p.cor], x - tam / 2, p.y - tam / 2, tam, tam);
      }
      ctx.globalAlpha = 1;

      quadro = requestAnimationFrame(pintar);
    };

    dimensionar();
    addEventListener("resize", dimensionar);
    quadro = requestAnimationFrame(pintar);

    return () => {
      cancelAnimationFrame(quadro);
      removeEventListener("resize", dimensionar);
    };
  }, [pathname]);

  return <canvas className="chuva-brilho" ref={ref} aria-hidden="true" />;
}
