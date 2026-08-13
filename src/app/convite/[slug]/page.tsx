import { notFound } from "next/navigation";
import { getConvidado } from "@/lib/supabase-functions";
import ConviteClient from "./convite-client";

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let convidado;
  try {
    convidado = await getConvidado(slug);
  } catch {
    notFound();
  }

  if (!convidado) {
    notFound();
  }

  return <ConviteClient convidadoInicial={convidado} />;
}
