import { createStaticPix, hasError } from "pix-utils";
import QRCode from "qrcode";

// Dados fixos do recebedor do Pix, compartilhados por todo lugar do site que
// gera um QR Code (pagamento do after, lista de presentes, etc).
export const PIX_CONFIG_PADRAO = {
  chavePix: process.env.NEXT_PUBLIC_PIX_KEY || "51999714595",
  nomeRecebedor: process.env.NEXT_PUBLIC_PIX_NOME || "Laura e Gu",
  cidadeRecebedor: process.env.NEXT_PUBLIC_PIX_CIDADE || "PORTO ALEGRE",
};

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
