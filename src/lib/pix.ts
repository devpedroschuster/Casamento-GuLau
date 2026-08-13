import { createStaticPix, hasError } from "pix-utils";
import QRCode from "qrcode";

interface GerarPixQrCodeParams {
  chavePix: string;
  nomeRecebedor: string;
  cidadeRecebedor: string;
  valor: number; // a lib exige um valor fixo por QR Code (Pix estático)
  identificador?: string; // ex: slug do convidado, aparece como referência
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
