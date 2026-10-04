"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const CORES = ["255,236,180", "255,255,255", "232,220,200", "255,213,140"];

/** Traço vertical de brilho caindo devagar, como um fio de chuva dourada —
    inspirado no vídeo de referência dos noivos (cortina de partículas caindo,
    mais forte nas laterais e mais rala no centro, onde fica o texto). */
function criarTraco(cor: string) {
  const W = 14;
  const H = 150;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (!g) return c;

  const meio = W / 2;

  const halo = g.createLinearGradient(0, 0, 0, H);
  halo.addColorStop(0, `rgba(${cor},0)`);
  halo.addColorStop(0.5, `rgba(${cor},0.55)`);
  halo.addColorStop(1, `rgba(${cor},0)`);
  g.fillStyle = halo;
  g.fillRect(0, 0, W, H);

  const nucleo = g.createLinearGradient(0, 0, 0, H);
  nucleo.addColorStop(0, `rgba(${cor},0)`);
  nucleo.addColorStop(0.15, `rgba(${cor},0.9)`);
  nucleo.addColorStop(0.5, `rgba(255,255,255,1)`);
  nucleo.addColorStop(0.85, `rgba(${cor},0.9)`);
  nucleo.addColorStop(1, `rgba(${cor},0)`);
  g.fillStyle = nucleo;
  g.fillRect(meio - 1, 0, 2, H);

  return c;
}

type Traco = {
  x: number;
  y: number;
  h: number;
  s: number;
  vel: number;
  fase: number;
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

/** Chuva de brilho — igual ao StarField, mas na frente do conteúdo (para
    aparecer em qualquer seção, mesmo as com foto/card por baixo), sempre
    atrás do menu fixo e sem nunca bloquear cliques. Não aparece na
    convocação dos padrinhos, no painel /admin, nem para quem prefere menos
    movimento. */
export default function ChuvaBrilho() {
  const pathname = usePathname();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (pathname?.startsWith("/padrinhos") || pathname?.startsWith("/admin")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;

    const sprites = CORES.map(criarTraco);
    let tracos: Traco[] = [];
    let quadro = 0;
    let ultimoT = 0;

    const dimensionar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = innerWidth * dpr;
      cv.height = innerHeight * dpr;
      cv.style.width = `${innerWidth}px`;
      cv.style.height = `${innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const area = innerWidth * innerHeight;
      const n = Math.min(Math.round(area / 10000), 95);
      tracos = [];
      for (let i = 0; i < n; i++) {
        tracos.push({
          x: xComBordaPreferida(innerWidth),
          y: Math.random() * innerHeight - innerHeight,
          h: 70 + Math.random() * 90,
          s: (Math.random() * CORES.length) | 0,
          vel: 14 + Math.random() * 22,
          fase: Math.random() * Math.PI * 2,
        });
      }
    };

    const pintar = (t: number) => {
      const dt = ultimoT ? Math.min((t - ultimoT) / 1000, 0.05) : 0;
      ultimoT = t;
      const s = t / 1000;

      ctx.clearRect(0, 0, innerWidth, innerHeight);

      for (const p of tracos) {
        p.y += p.vel * dt;
        if (p.y - p.h > innerHeight) {
          p.y = -p.h;
          p.x = xComBordaPreferida(innerWidth);
        }
        const brilhar = 0.5 + 0.5 * Math.sin(s * 0.6 + p.fase);
        ctx.globalAlpha = 0.3 + 0.4 * brilhar;
        ctx.drawImage(sprites[p.s], p.x - 7, p.y, 14, p.h);
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
