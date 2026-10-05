// Regras do nome que o convidado digita na capa. A Edge Function
// buscar-convite tem uma cópia de normalizarNome (ela é publicada como um
// arquivo só): se mudar aqui, mude lá também.

/** Sem acento, minúsculo, espaços colapsados e sem espaços nas pontas. */
export function normalizarNome(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Mesmo nome inteiro, ignorando acento, maiúscula e espaços extras. */
export function mesmoNome(a: string, b: string): boolean {
  const normalizado = normalizarNome(a);
  return normalizado.length > 0 && normalizado === normalizarNome(b);
}

export type NomeExistente = { nome: string; grupo: string };

/** Nomes novos que já existem na lista (mesmo nome normalizado). */
export function nomesJaExistentes(novos: string[], existentes: NomeExistente[]) {
  const porNome = new Map(existentes.map((e) => [normalizarNome(e.nome), e]));
  return novos.flatMap((nome) => {
    const existente = porNome.get(normalizarNome(nome));
    return existente ? [{ nome, existente }] : [];
  });
}

/** Nomes que aparecem mais de uma vez (normalizados), cada um listado uma vez
    com a grafia da primeira aparição. */
export function nomesRepetidos(nomes: string[]): string[] {
  const vistos = new Map<string, { nome: string; vezes: number }>();
  for (const nome of nomes) {
    const chave = normalizarNome(nome);
    const atual = vistos.get(chave);
    if (atual) atual.vezes++;
    else vistos.set(chave, { nome, vezes: 1 });
  }
  return [...vistos.values()].filter((v) => v.vezes > 1).map((v) => v.nome);
}
