import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { registerHooks } from "node:module";

// versoes.ts importa "./dados" sem extensão (como o Next espera); no Node puro,
// tenta de novo com ".ts".
registerHooks({
  resolve(especificador, contexto, proximo) {
    try {
      return proximo(especificador, contexto);
    } catch (erro) {
      if (especificador.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(especificador)) {
        return proximo(`${especificador}.ts`, contexto);
      }
      throw erro;
    }
  },
});
const { VERSAO_PRIMEIRO_HORARIO, VERSAO_SEGUNDO_HORARIO, versaoDoPerfil } = await import("./versoes.ts");

test("1º horário (cerimonia_festa_after): arte e contagem das 18:00", () => {
  const v = versaoDoPerfil("cerimonia_festa_after");
  assert.equal(v.telas[1].imagem.src, "/convite/02-contagem-18h.png");
  assert.equal(v.alvoContagem, "2026-11-28T18:00:00-03:00");
});

test("2º horário (festa_after): arte e contagem das 23:00", () => {
  const v = versaoDoPerfil("festa_after");
  assert.equal(v.telas[1].imagem.src, "/convite/02-contagem-23h.png");
  assert.equal(v.telas[1].contagem, true);
  assert.equal(v.alvoContagem, "2026-11-28T23:00:00-03:00");
});

test("os dois horários só diferem na arte da contagem e no horário", () => {
  const resto = (v) => ({ ...v, telas: v.telas.filter((_, i) => i !== 1), alvoContagem: null });
  assert.deepEqual(resto(VERSAO_SEGUNDO_HORARIO), resto(VERSAO_PRIMEIRO_HORARIO));
});

test("toda imagem das duas versões existe em public/", () => {
  for (const v of [VERSAO_PRIMEIRO_HORARIO, VERSAO_SEGUNDO_HORARIO]) {
    const imagens = [...v.telas.map((t) => t.imagem), v.afterConfirmada, v.after, v.comprovanteAfter];
    for (const { src } of imagens) {
      assert.ok(fs.existsSync(new URL(`../../../public${src}`, import.meta.url)), `falta ${src}`);
    }
  }
});
