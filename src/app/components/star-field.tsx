"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export const CORES = ["236,214,164", "212,220,232", "255,249,232", "201,162,93"];

/** Sprite da estrela de quatro pontas, desenhado uma única vez por cor. */
function criarSprite(cor: string) {
  const S = 96;
  const meio = S / 2;
  const r = S / 7;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d");
  if (!g) return c;

  const halo = g.createRadialGradient(meio, meio, 0, meio, meio, meio);
  halo.addColorStop(0, `rgba(${cor},.95)`);
  halo.addColorStop(0.14, `rgba(${cor},.42)`);
  halo.addColorStop(0.42, `rgba(${cor},.10)`);
  halo.addColorStop(1, `rgba(${cor},0)`);
  g.fillStyle = halo;
  g.fillRect(0, 0, S, S);

  const ponta = r * 4.4;
  const cintura = r * 0.42;
  g.fillStyle = `rgba(${cor},1)`;
  g.beginPath();
  g.moveTo(meio, meio - ponta);
  g.quadraticCurveTo(meio + cintura, meio - cintura, meio + ponta, meio);
  g.quadraticCurveTo(meio + cintura, meio + cintura, meio, meio + ponta);
  g.quadraticCurveTo(meio - cintura, meio + cintura, meio - ponta, meio);
  g.quadraticCurveTo(meio - cintura, meio - cintura, meio, meio - ponta);
  g.fill();

  // núcleo branco: é o que faz a estrela parecer acesa, e não desenhada
  const nucleo = g.createRadialGradient(meio, meio, 0, meio, meio, r * 1.15);
  nucleo.addColorStop(0, "rgba(255,255,255,1)");
  nucleo.addColorStop(0.5, "rgba(255,252,242,.8)");
  nucleo.addColorStop(1, "rgba(255,252,242,0)");
  g.fillStyle = nucleo;
  g.beginPath();
  g.arc(meio, meio, r * 1.15, 0, Math.PI * 2);
  g.fill();

  return c;
}

type Estrela = {
  x: number;
  y: number;
  t: number;
  s: number;
  fase: number;
  vel: number;
  deriva: number;
};

type Poeira = { x: number; y: number; r: number; cor: string; fase: number; vel: number };

/** Céu de estrelas piscando, compartilhado entre o site principal e a
    convocação dos padrinhos: um sprite por cor, desenhado uma única vez fora
    da tela; o loop só reposiciona e muda a opacidade, o que mantém a
    densidade alta sem pesar no celular.

    `sempreAtivo` existe porque este mesmo componente tem dois usos com regras
    opostas: o layout raiz quer desligar o loop na rota /padrinhos (o
    envelope tem seu próprio fundo opaco, então desenhar ali seria à toa),
    enquanto a própria convocação usa este componente exatamente naquela rota
    e precisa que ele rode. */
export default function StarField({
  className = "star-field",
  sempreAtivo = false,
}: {
  className?: string;
  sempreAtivo?: boolean;
}) {
  const pathname = usePathname();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!sempreAtivo && pathname?.startsWith("/padrinhos")) return;

    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;

    const sprites = CORES.map(criarSprite);
    let estrelas: Estrela[] = [];
    let poeirinha: Poeira[] = [];
    let quadro = 0;

    const dimensionar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = innerWidth * dpr;
      cv.height = innerHeight * dpr;
      cv.style.width = `${innerWidth}px`;
      cv.style.height = `${innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const area = innerWidth * innerHeight;

      estrelas = [];
      const n = Math.min(Math.round(area / 9000), 260);
      for (let i = 0; i < n; i++) {
        estrelas.push({
          x: Math.random() * innerWidth,
          y: Math.random() * innerHeight,
          // poucas grandes, muitas pequenas
          t: 8 + Math.pow(Math.random(), 2.6) * 40,
          s: (Math.random() * CORES.length) | 0,
          fase: Math.random() * Math.PI * 2,
          vel: 0.55 + Math.random() * 1.5,
          deriva: 0.02 + Math.random() * 0.09,
        });
      }

      poeirinha = [];
      const m = Math.min(Math.round(area / 4200), 520);
      for (let j = 0; j < m; j++) {
        poeirinha.push({
          x: Math.random() * innerWidth,
          y: Math.random() * innerHeight,
          r: Math.random() * 1.1 + 0.35,
          cor: CORES[(Math.random() * CORES.length) | 0],
          fase: Math.random() * Math.PI * 2,
          vel: 0.7 + Math.random() * 2.1,
        });
      }
    };

    const pintar = (t: number) => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      const s = t / 1000;

      for (const d of poeirinha) {
        const a = 0.12 + 0.78 * Math.pow(0.5 + 0.5 * Math.sin(s * d.vel + d.fase), 2);
        ctx.fillStyle = `rgba(${d.cor},${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const e of estrelas) {
        // expoente alto = a estrela apaga de vez e reacende, em vez de pulsar
        const a = 0.1 + 0.9 * Math.pow(0.5 + 0.5 * Math.sin(s * e.vel + e.fase), 1.9);
        if (a < 0.02) continue;
        const tam = e.t * (0.72 + 0.28 * a);
        e.y -= e.deriva;
        if (e.y < -tam) e.y = innerHeight + tam;
        ctx.globalAlpha = a;
        ctx.drawImage(sprites[e.s], e.x - tam / 2, e.y - tam / 2, tam, tam);
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
  }, [pathname, sempreAtivo]);

  return <canvas className={className} ref={ref} aria-hidden="true" />;
}
