# Réplica do convite: entrada por nome, duas versões e confirmação real — Plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A capa pede o nome; só quem está na lista entra, numa versão escolhida pelo `perfil`; "Confirmar presença" grava a confirmação de cada pessoa do grupo.

**Architecture:** As telas viram dados (`versoes.ts`), então cada versão é um conjunto de imagens e áreas. A capa ganha um formulário (`capa-entrada.tsx`) que chama a busca que já existe e entrega o `Convite` ao componente principal. A tela 7 abre uma janela (`janela-confirmacao.tsx`) que grava com a função `confirmar-presenca` que já existe. Nenhuma mudança no Supabase.

**Tech Stack:** Next.js 16.3, React 19, TypeScript, CSS puro (`convite-replica.css`), `src/lib/supabase-functions.ts` existente. Sem framework de testes: a verificação é `tsc`, lint, build e um servidor falso das duas funções no navegador.

**Spec:** `docs/superpowers/specs/2026-10-03-convite-replica-checkin-design.md` (continua `2026-10-03-convite-replica-design.md`)

## Global Constraints

- Primeiro horário = `perfil` `cerimonia_festa_after`; segundo horário = `perfil` `festa_after`. O segundo usa, por enquanto, a mesma versão do primeiro (provisória, comentada no código).
- Sem mudanças no Supabase (tabelas, RPC, Edge Functions) e sem novo deploy. Backend usado: `buscar-convite` e `confirmar-presenca`.
- A capa é comum às duas versões. O botão continua com o rótulo "ENTRAR".
- Campo de nome: fonte de 16px; chave `localStorage` `laura-gu:nome-checkin`; preenchido sem entrar sozinho; sem `setState` em efeito.
- Mensagens de erro exatas: "Digite seu nome" (campo vazio, sem chamar o backend); mensagens do backend para 400/404/409/500; "Não foi possível verificar agora. Tente de novo." para falha de rede.
- Janela de confirmação: uma caixa por pessoa, marcadas por padrão (exceto quem tinha `confirmou_festa === false`); marcada → `confirmou_festa: true` e, só no perfil `cerimonia_festa_after`, `confirmou_cerimonia: true`; desmarcada → `false` nos mesmos campos; CONFIRMAR desabilitado sem ninguém marcado; o After não é registrado.
- As telas, áreas clicáveis e a sequência do After devem continuar idênticas ao que foi verificado antes (mesmas medidas, 375 px e 1280 px).
- Lint: no máximo os 5 problemas que já existem em `origin/main` (3 erros, 2 avisos). `tsc` limpo (`npx next typegen` antes, num worktree sem `.next`).
- `next-env.d.ts` é gerado: não commitar mudanças nele.
- Mensagens de commit terminam com `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

Pasta de trabalho (usada abaixo como `$EXTRAIDOS`):
`C:/Users/pedro/AppData/Local/Temp/claude/C--Users-pedro-Desktop-Eu-Projetos-casamentogulau/35af0ea7-babe-4f36-8b41-0d124d0d5562/scratchpad`

---

### Task 1: Telas orientadas a dados (sem mudar o comportamento)

**Files:**
- Create: `src/app/convite-replica/versoes.ts`
- Create: `src/app/convite-replica/foto.tsx`
- Modify: `src/app/convite-replica/convite-replica.tsx` (substituir tudo)

**Interfaces:**
- Produces (`versoes.ts`): `type Imagem`, `type TelaConfig`, `type Versao`, `VERSAO_PRIMEIRO_HORARIO: Versao`, `VERSAO_SEGUNDO_HORARIO: Versao`, `versaoDoPerfil(perfil: Perfil): Versao`.
- Produces (`foto.tsx`): `export default function Foto({ imagem, prioridade?, imgRef?, aoCarregar? })`.

- [ ] **Step 1: Criar `src/app/convite-replica/versoes.ts`**

```ts
import type { Perfil } from "@/lib/supabase-functions";
import {
  AREAS_INDICACOES,
  AREAS_MAPA,
  LUZES_ABERTURA,
  LUZES_DRESS,
  PIX_AFTER,
  PRESENTES,
  type AreaClicavel,
  type Luz,
  type Presente,
} from "./dados";

export type Imagem = { src: string; largura: number; altura: number; alt: string };

export type TelaConfig = {
  imagem: Imagem;
  classe?: string;
  luzes?: { luzes: Luz[]; classe: "rc-luz-abertura" | "rc-luz-dress" };
  /** Sobrepõe a contagem regressiva ao vivo sobre as caixas desenhadas. */
  contagem?: boolean;
  /** Links invisíveis sobre botões já desenhados na imagem. */
  areas?: AreaClicavel[];
  /** 9 áreas clicáveis que abrem o modal Pix de cada presente. */
  presentes?: boolean;
  /** Botão desenhado de "Confirmar presença". */
  confirmar?: boolean;
};

export type Versao = {
  telas: TelaConfig[];
  afterConfirmada: Imagem;
  after: Imagem;
  pixAfter: string;
  presentes: Presente[];
  /** Data/hora do evento, ISO com fuso, para a contagem regressiva. */
  alvoContagem: string;
};

const pagina = (n: number, src: string): Imagem => ({
  src,
  largura: 1024,
  altura: 1536,
  alt: `Página ${n}`,
});

export const VERSAO_PRIMEIRO_HORARIO: Versao = {
  telas: [
    {
      imagem: pagina(1, "/convite/01-abertura.png"),
      classe: "rc-abertura",
      luzes: { luzes: LUZES_ABERTURA, classe: "rc-luz-abertura" },
    },
    { imagem: pagina(2, "/convite/02-contagem.jpg"), contagem: true },
    { imagem: pagina(3, "/convite/03-como-chegar.png"), areas: AREAS_MAPA },
    {
      imagem: pagina(4, "/convite/04-dress-code.png"),
      classe: "rc-dress",
      luzes: { luzes: LUZES_DRESS, classe: "rc-luz-dress" },
    },
    { imagem: pagina(5, "/convite/05-indicacoes.png"), areas: AREAS_INDICACOES },
    { imagem: pagina(6, "/convite/06-presentes.png"), presentes: true },
    { imagem: pagina(7, "/convite/07-confirmar.png"), confirmar: true },
  ],
  afterConfirmada: {
    src: "/convite/after-1-confirmada.png",
    largura: 1024,
    altura: 1536,
    alt: "Sua presença está confirmada",
  },
  after: { src: "/convite/after-2.jpg", largura: 1024, altura: 1536, alt: "After" },
  pixAfter: PIX_AFTER,
  presentes: PRESENTES,
  alvoContagem: "2026-11-28T17:00:00-03:00",
};

/** PROVISÓRIA: enquanto a arte do segundo horário não chega, a lista
    `festa_after` vê a mesma versão do primeiro horário. Quando chegar, é só
    trocar por um objeto `Versao` com as imagens, áreas e horário próprios. */
export const VERSAO_SEGUNDO_HORARIO: Versao = VERSAO_PRIMEIRO_HORARIO;

export function versaoDoPerfil(perfil: Perfil): Versao {
  return perfil === "festa_after" ? VERSAO_SEGUNDO_HORARIO : VERSAO_PRIMEIRO_HORARIO;
}
```

- [ ] **Step 2: Criar `src/app/convite-replica/foto.tsx`**

```tsx
import Image from "next/image";
import type { Imagem } from "./versoes";

/** Imagem de tela inteira, servida sem recompressão (`unoptimized`). Só a capa
    usa `preload`; as demais carregam já ("eager"), como no HTML original. */
export default function Foto({
  imagem,
  prioridade = false,
  imgRef,
  aoCarregar,
}: {
  imagem: Imagem;
  prioridade?: boolean;
  imgRef?: React.Ref<HTMLImageElement>;
  aoCarregar?: () => void;
}) {
  return (
    <Image
      ref={imgRef}
      src={imagem.src}
      alt={imagem.alt}
      width={imagem.largura}
      height={imagem.altura}
      unoptimized
      preload={prioridade}
      loading={prioridade ? undefined : "eager"}
      onLoad={aoCarregar}
    />
  );
}
```

- [ ] **Step 3: Substituir `src/app/convite-replica/convite-replica.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./convite-replica.css";
import Foto from "./foto";
import { PRESENTES_TOPO, type AreaClicavel, type Luz } from "./dados";
import { VERSAO_PRIMEIRO_HORARIO, type Imagem } from "./versoes";

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
  const [aberto, setAberto] = useState(false);
  const [atual, setAtual] = useState(0);
  const [agora, setAgora] = useState<number | null>(null);
  const [afterAberto, setAfterAberto] = useState(false);
  const [ativo, setAtivo] = useState<AfterAtivo>("nenhum");
  const [presente, setPresente] = useState<number | null>(null);
  const [statusPix, setStatusPix] = useState("");
  const [areaPix, setAreaPix] = useState<CSSProperties>({});
  const [after2Carregada, setAfter2Carregada] = useState(false);

  const versao = VERSAO_PRIMEIRO_HORARIO;
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
          <button type="button" className="rc-entrar" onClick={() => setAberto(true)}>
            ENTRAR
          </button>
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
```

- [ ] **Step 4: tsc e lint**

Run: `npx next typegen` (se `.next` não existir) e `npx tsc --noEmit` → sem saída. Run: `npm run lint` → `✖ 5 problems (3 errors, 2 warnings)`, nenhum arquivo de `src/app/convite-replica/`.

- [ ] **Step 5: Conferir que nada mudou no navegador**

Subir `npm run dev -- -p 3006` (em segundo plano) e, em 375×812, após ENTRAR, rodar o script das áreas clicáveis (Task 4, Step 1) e o das seções. Esperado: 7 seções com topos `0, 568, 1135, 1703, 2270, 2838, 3405`, largura 375, altura 567,5, `docH` 3973; 20 áreas com os mesmos percentuais de antes.

- [ ] **Step 6: Commit**

```bash
git add src/app/convite-replica/versoes.ts src/app/convite-replica/foto.tsx src/app/convite-replica/convite-replica.tsx
git commit -m "Drive the replica screens from per-version data

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Entrada por nome na capa

**Files:**
- Create: `src/app/convite-replica/capa-entrada.tsx`
- Modify: `src/app/convite-replica/convite-replica.tsx`
- Modify: `src/app/convite-replica/convite-replica.css`
- Create (fora do repositório): `$EXTRAIDOS/mock-funcoes.mjs`

**Interfaces:**
- Consumes: `buscarConvite(busca: string): Promise<Convite>` e o tipo `Convite` de `@/lib/supabase-functions`; `versaoDoPerfil`, `VERSAO_PRIMEIRO_HORARIO` (Task 1).
- Produces: `export default function CapaEntrada({ aoEntrar }: { aoEntrar: (convite: Convite) => void })`.

- [ ] **Step 1: Criar `src/app/convite-replica/capa-entrada.tsx`**

```tsx
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
```

- [ ] **Step 2: Ligar a capa e o convite em `convite-replica.tsx`**

Importações (trocar a linha de `versoes` e acrescentar duas):

```tsx
import type { Convite } from "@/lib/supabase-functions";
import CapaEntrada from "./capa-entrada";
import { VERSAO_PRIMEIRO_HORARIO, versaoDoPerfil, type Imagem } from "./versoes";
```

Estado e versão (trocar o `useState(false)` de `aberto` e a linha `const versao = ...`):

```tsx
  const [convite, setConvite] = useState<Convite | null>(null);
  ...
  const aberto = convite !== null;
  const versao = convite ? versaoDoPerfil(convite.perfil) : VERSAO_PRIMEIRO_HORARIO;
```

(remover `const [aberto, setAberto] = useState(false);`; antes de entrar, o site oculto usa a versão do primeiro horário, então as imagens carregam cedo como no original.)

Capa (trocar o `<button className="rc-entrar" ...>ENTRAR</button>`):

```tsx
          <CapaEntrada aoEntrar={setConvite} />
```

- [ ] **Step 3: CSS da entrada em `convite-replica.css`**

Trocar a regra `.rc-entrar` (que tinha `position: absolute; bottom: 8%`) e acrescentar as novas:

```css
/* Entrada da capa: campo de nome + ENTRAR, ancorados em 8% do fundo. O ENTRAR
   continua na mesma posição do original; o campo e o erro empilham acima dele. */
.rc-entrada {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 8%;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.rc-entrar {
  padding: 15px 42px;
  border: 1px solid white;
  border-radius: 40px;
  background: rgba(20, 12, 6, 0.45);
  color: white;
  letter-spacing: 4px;
  font-size: 15px;
}
.rc-entrar:disabled {
  opacity: 0.6;
}
.rc-entrada-campo {
  width: min(78vw, 300px);
  padding: 13px 20px;
  border: 1px solid white;
  border-radius: 40px;
  background: rgba(20, 12, 6, 0.45);
  color: white;
  font: 16px Arial, sans-serif;
  letter-spacing: 1px;
  text-align: center;
  appearance: none;
}
.rc-entrada-campo::placeholder {
  color: rgba(255, 255, 255, 0.7);
  opacity: 1;
}
.rc-entrada-campo:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35);
}
.rc-entrada-campo:disabled {
  opacity: 0.6;
}
.rc-entrada-erro {
  margin: 0;
  max-width: min(86vw, 320px);
  text-align: center;
  color: white;
  font: 14px/1.35 Arial, sans-serif;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.85), 0 0 10px rgba(0, 0, 0, 0.6);
}
```

- [ ] **Step 4: Servidor falso das funções — `$EXTRAIDOS/mock-funcoes.mjs`**

```js
import http from "node:http";

const normalizar = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const p = (id, nome) => ({
  id, nome, checkin_em: null, confirmou_cerimonia: null, confirmou_festa: null,
  confirmou_after: null, status_pagamento_after: "nao_aplicavel", valor_after: null, respondido_em: null,
});
const grupos = [
  { id: "g1", nome_exibicao: "Ana Souza e Bruno Lima", perfil: "cerimonia_festa_after", pessoas: [p("ana-1", "Ana Souza"), p("ana-2", "Bruno Lima")] },
  { id: "g2", nome_exibicao: "Carla Dias", perfil: "festa_after", pessoas: [p("carla-1", "Carla Dias")] },
  { id: "g3", nome_exibicao: "Familia Rocha", perfil: "cerimonia_festa_after", pessoas: [p("tres-1", "Diego Rocha"), p("tres-2", "Elisa Rocha"), p("tres-3-falha", "Fabio Rocha")] },
];
const log = [];
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (res, status, corpo) => {
  res.writeHead(status, { ...cors, "Content-Type": "application/json" });
  res.end(JSON.stringify(corpo));
};

http.createServer((req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(200, cors); return res.end("ok"); }
  if (req.method === "GET" && req.url === "/_log") return json(res, 200, log);
  let corpo = "";
  req.on("data", (c) => (corpo += c));
  req.on("end", () => {
    const dados = corpo ? JSON.parse(corpo) : {};
    log.push({ rota: req.url, corpo: dados });
    if (req.url === "/buscar-convite") {
      const termo = normalizar(String(dados.busca ?? ""));
      if (termo.length < 2) return json(res, 400, { error: "Digite pelo menos 2 letras do nome" });
      if (termo === "offline") return res.socket.destroy();
      if (termo === "quebra") return json(res, 500, { error: "Erro inesperado" });
      if (termo === "silva") return json(res, 409, { error: "Encontramos mais de uma pessoa com esse nome. Digite o nome completo." });
      const achados = grupos.filter((g) => g.pessoas.some((x) => normalizar(x.nome).includes(termo)));
      if (achados.length === 0) return json(res, 404, { error: "Não encontramos esse nome na lista de convidados" });
      const g = achados[0];
      const agora = new Date().toISOString();
      for (const x of g.pessoas) if (!x.checkin_em) x.checkin_em = agora;
      return json(res, 200, { convite: g });
    }
    if (req.url === "/confirmar-presenca") {
      const pessoa = grupos.flatMap((g) => g.pessoas).find((x) => x.id === dados.convidado_id);
      if (!pessoa) return json(res, 404, { error: "Convidado não encontrado" });
      if (pessoa.id.includes("falha")) return json(res, 500, { error: "Erro ao salvar confirmação" });
      for (const k of ["confirmou_cerimonia", "confirmou_festa", "confirmou_after"]) {
        if (typeof dados[k] === "boolean") pessoa[k] = dados[k];
      }
      pessoa.respondido_em = new Date().toISOString();
      return json(res, 200, { convidado: pessoa });
    }
    json(res, 404, { error: "rota desconhecida" });
  });
}).listen(4020, () => console.log("mock das funções em http://localhost:4020"));
```

- [ ] **Step 5: tsc e lint**

`npx tsc --noEmit` → limpo; `npm run lint` → mesmos 5 problemas.

- [ ] **Step 6: Verificar a entrada no navegador (375×812)**

Subir o mock (`node "$EXTRAIDOS/mock-funcoes.mjs"`, em segundo plano) e o dev server apontando para ele:
`NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL=http://localhost:4020 NEXT_PUBLIC_SUPABASE_ANON_KEY=teste npm run dev -- -p 3006` (em segundo plano). Para cada caso, preencher o campo, enviar o formulário (`form.requestSubmit()`) e ler `[role=alert]`:

| Digitado | Esperado na capa |
|---|---|
| (vazio) | "Digite seu nome" (e nenhuma chamada em `/_log`) |
| `a` | "Digite pelo menos 2 letras do nome" |
| `zzzz` | "Não encontramos esse nome na lista de convidados" |
| `silva` | "Encontramos mais de uma pessoa com esse nome. Digite o nome completo." |
| `quebra` | "Erro inesperado" |
| `offline` | "Não foi possível verificar agora. Tente de novo." |
| `ana` | capa some, `.rc-site.rc-visivel`, nav "1 / 7"; `/_log` mostra a busca; `localStorage["laura-gu:nome-checkin"] === "ana"` |

Conferir também: botão ENTRAR a `y ≈ 698` e `170×49` como antes (o campo fica acima); recarregar e ver o campo preenchido com `ana` sem entrar sozinho; o campo tem `font-size: 16px`.

- [ ] **Step 7: Commit**

```bash
git add src/app/convite-replica/capa-entrada.tsx src/app/convite-replica/convite-replica.tsx src/app/convite-replica/convite-replica.css
git commit -m "Ask for the guest name on the cover before opening the site

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Janela de confirmação

**Files:**
- Create: `src/app/convite-replica/janela-confirmacao.tsx`
- Modify: `src/app/convite-replica/convite-replica.tsx`
- Modify: `src/app/convite-replica/convite-replica.css`

**Interfaces:**
- Consumes: `confirmarPresenca(convidadoId, confirmacoes)`, tipos `Perfil`, `Pessoa`, `Convite` de `@/lib/supabase-functions`.
- Produces: `export default function JanelaConfirmacao({ pessoas, perfil, aoGravar, aoConcluir, aoFechar }: { pessoas: Pessoa[]; perfil: Perfil; aoGravar: (gravadas: Pessoa[]) => void; aoConcluir: () => void; aoFechar: () => void })`.

- [ ] **Step 1: Criar `src/app/convite-replica/janela-confirmacao.tsx`**

```tsx
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
```

- [ ] **Step 2: Ligar a janela em `convite-replica.tsx`**

Importações (acrescentar `Pessoa` e a janela):

```tsx
import type { Convite, Pessoa } from "@/lib/supabase-functions";
import JanelaConfirmacao from "./janela-confirmacao";
```

Estado (junto dos outros `useState`):

```tsx
  const [confirmando, setConfirmando] = useState(false);
```

Funções (junto de `abrirAfter`):

```tsx
  function atualizarPessoas(gravadas: Pessoa[]) {
    setConvite((c) =>
      c && { ...c, pessoas: c.pessoas.map((p) => gravadas.find((g) => g.id === p.id) ?? p) },
    );
  }

  function concluirConfirmacao() {
    setConfirmando(false);
    abrirAfter();
  }
```

Botão da tela 7 (trocar `onClick={abrirAfter}` por):

```tsx
                onClick={() => setConfirmando(true)}
```

Renderização (logo antes do `<div className={`rc-pix-modal...`}>` dos presentes):

```tsx
      {confirmando && convite && (
        <JanelaConfirmacao
          pessoas={convite.pessoas}
          perfil={convite.perfil}
          aoGravar={atualizarPessoas}
          aoConcluir={concluirConfirmacao}
          aoFechar={() => setConfirmando(false)}
        />
      )}
```

- [ ] **Step 3: CSS da janela (acrescentar a `convite-replica.css`, antes do bloco "Desktop")**

```css
/* ── Janela de confirmação de presença ────────────────────────────────── */
.rc-confirma-apoio {
  margin: 0 0 14px;
  font-size: 14px;
  color: #7a4b1a;
}
.rc-confirma-lista {
  list-style: none;
  margin: 0 0 4px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rc-confirma-linha {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #c99b63;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  color: #4d2c12;
  font-size: 17px;
  text-align: left;
  cursor: pointer;
}
.rc-confirma-linha input {
  width: 20px;
  height: 20px;
  flex: none;
  accent-color: #8b541c;
}
.rc-pix-acoes button:disabled {
  opacity: 0.55;
  cursor: default;
}
```

- [ ] **Step 4: tsc e lint**

`npx tsc --noEmit` → limpo; `npm run lint` → mesmos 5 problemas.

- [ ] **Step 5: Verificar a confirmação no navegador (375×812, mock no ar)**

Antes de cada cenário recarregar a página e (para estado limpo) reiniciar o mock quando necessário. Conferir também em `http://localhost:4020/_log`:

| Cenário | Esperado |
|---|---|
| `ana` (2 pessoas, perfil 1): abrir tela 7 → tocar no botão | janela "CONFIRMAR PRESENÇA" com Ana Souza e Bruno Lima marcados; FECHAR fecha sem chamadas |
| mesmo, CONFIRMAR | 2 chamadas `confirmar-presenca` com `confirmou_cerimonia: true, confirmou_festa: true`; janela fecha; sequência do After inicia (`.rc-after.rc-visivel`) |
| `ana`, desmarcar Bruno, CONFIRMAR | Ana `true/true`; Bruno `confirmou_cerimonia: false, confirmou_festa: false` |
| reabrir a janela na mesma visita | Bruno desmarcado, Ana marcada |
| desmarcar todos | CONFIRMAR desabilitado |
| `carla` (1 pessoa, perfil 2): CONFIRMAR | 1 chamada só com `confirmou_festa: true` (sem `confirmou_cerimonia`) |
| `rocha` (3 pessoas, a 3ª falha): CONFIRMAR | janela continua aberta; mensagem "Não conseguimos salvar a confirmação de Fabio Rocha. Tente de novo."; o After não inicia; Diego e Elisa gravados em `/_log` |

- [ ] **Step 6: Commit**

```bash
git add src/app/convite-replica/janela-confirmacao.tsx src/app/convite-replica/convite-replica.tsx src/app/convite-replica/convite-replica.css
git commit -m "Record each guest's confirmation from the confirm screen

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Verificação final e build

**Files:**
- Modify (se a verificação achar diferenças): arquivos das Tasks 1–3

**Interfaces:**
- Consumes: tudo das Tasks 1–3.
- Produces: `npm run build` verde e relatório.

- [ ] **Step 1: Geometria no celular após entrar**

Em 375×812, entrar com `ana` e rodar nas seções e nas áreas clicáveis (mesmos scripts de antes). Esperado: seções em `0, 568, 1135, 1703, 2270, 2838, 3405` (largura 375, altura 567,5, `docH` 3973); 20 áreas com os mesmos percentuais e `href`, `target`, `rel` de antes; nav `124×45`; números da contagem iguais aos de antes (mesma posição e fonte).

- [ ] **Step 2: Desktop 1280×800**

Entrar com `ana`: seções de 520 px centralizadas, mesmos percentuais das áreas, nav centralizada. Na capa, o campo e o ENTRAR centralizados e a mensagem de erro legível.

- [ ] **Step 3: Segundo horário**

Entrar com `carla` (`festa_after`): o site abre com as 7 telas (versão provisória) e o contador "1 / 7".

- [ ] **Step 4: Build**

Run: `npm run build` → concluído, rota `/` listada.

- [ ] **Step 5: Encerrar**

Parar o dev server (3006) e o mock (4020). `git checkout -- next-env.d.ts` se estiver modificado. `git status` limpo. Atualizar este plano com um "Registro da execução" e commitar. Relatar ao Pedro: o que foi verificado, o que só dá para testar no backend real (preview do Vercel) e os limites conhecidos do spec.
