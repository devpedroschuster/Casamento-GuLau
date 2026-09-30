import { createStaticPix, hasError } from "pix-utils";
import QRCode from "qrcode";

// Dados fixos do recebedor do Pix, compartilhados por todo lugar do site que
// gera um QR Code (pagamento do after, lista de presentes, etc). O after usa
// uma chave Pix separada (CHAVE_PIX_AFTER) — mesmo recebedor, chave diferente.
export const PIX_CONFIG_PADRAO = {
  chavePix: process.env.NEXT_PUBLIC_PIX_KEY || "afterlauraegu@gmail.com",
  nomeRecebedor: process.env.NEXT_PUBLIC_PIX_NOME || "GUSTAVO DOS S SILVA",
  cidadeRecebedor: process.env.NEXT_PUBLIC_PIX_CIDADE || "PORTO ALEGRE",
};

export const CHAVE_PIX_AFTER =
  process.env.NEXT_PUBLIC_PIX_KEY_AFTER || "5e679437-ee49-4dc3-9e96-a347f2ea9265";

interface GerarPixQrCodeParams {
  chavePix: string;
  nomeRecebedor: string;
  cidadeRecebedor: string;
  valor: number; // a lib exige um valor fixo por QR Code (Pix estático)
  identificador?: string; // ex: id da pessoa, aparece como referência
}

/**
 * Gera o payload Pix (BR Code) e o QR Code correspondente em data URL (base64),
 * pronto para ser usado num <img src="..." />.
 */
export async function gerarPixQrCode({
  chavePix,
  nomeRecebedor,
  cidadeRecebedor,
  valor,
  identificador,
}: GerarPixQrCodeParams) {
  const pix = createStaticPix({
    merchantName: nomeRecebedor,
    merchantCity: cidadeRecebedor,
    pixKey: chavePix,
    transactionAmount: valor,
    infoAdicional: identificador,
  });

  if (hasError(pix)) {
    throw new Error("Não foi possível gerar o Pix: " + pix.error);
  }

  const payload = pix.toBRCode();
  const qrCodeDataUrl = await QRCode.toDataURL(payload, {
    margin: 1,
    width: 320,
  });

  return { payload, qrCodeDataUrl };
}
