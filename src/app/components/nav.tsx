"use client";

const LINKS = [
  { href: "#historia", label: "História" },
  { href: "#informacoes", label: "Informações" },
  { href: "#como-chegar", label: "Como chegar" },
  { href: "#checkin", label: "Confirmar presença" },
];

export default function Nav() {
  return (
    <nav className="secao sticky top-0 z-20 backdrop-blur-md bg-onyx/70">
      <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <span className="font-display italic text-lg eyebrow-metal">Laura &amp; Gu</span>
        <div className="flex gap-4 overflow-x-auto text-xs tracking-wide uppercase text-platinum/70">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="whitespace-nowrap hover:text-champagne-light transition">
              {l.label}
            </a>
          ))}
        </div>
      </div>
      <div className="linha-metal" />
    </nav>
  );
}
