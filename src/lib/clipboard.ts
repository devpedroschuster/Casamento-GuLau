/** Copia texto para a área de transferência, com um fallback pra WebViews
    (WhatsApp, Instagram) que às vezes bloqueiam a Clipboard API. */
export async function copiarTexto(texto: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      // cai pro fallback abaixo
    }
  }

  const area = document.createElement("textarea");
  area.value = texto;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.focus();
  area.select();
  let sucesso = false;
  try {
    sucesso = document.execCommand("copy");
  } catch {
    sucesso = false;
  }
  document.body.removeChild(area);
  return sucesso;
}
