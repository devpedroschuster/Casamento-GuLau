import { NextResponse } from "next/server";

// Toda resposta das rotas do admin (sucesso ou erro) sai sem cache e fora dos
// buscadores: a página /admin não tem login, só não é divulgada.
export function jsonSeguro(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
