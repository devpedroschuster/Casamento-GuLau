type IconeProps = { className?: string };

const base = "w-8 h-8 mx-auto mb-2 text-champagne";

/** Ícones lineares para cada item da lista de presentes — o mesmo espírito dos
    ícones desenhados na referência dos noivos (traço fino, sem preenchimento),
    só que redesenhados como SVG de verdade para ficar nítido em qualquer tela. */

export function IconeTrancas({ className = base }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M9 3c0 2 3 2 3 4s-3 2-3 4 3 2 3 4-3 2-3 4" />
      <path d="M15 3c0 2-3 2-3 4s3 2 3 4-3 2-3 4 3 2 3 4" />
    </svg>
  );
}

export function IconeMassagem({ className = base }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={className} aria-hidden="true">
      <ellipse cx="12" cy="18" rx="7" ry="2.6" />
      <ellipse cx="12" cy="12.5" rx="5.2" ry="2.2" />
      <ellipse cx="12" cy="7.5" rx="3.4" ry="1.8" />
    </svg>
  );
}

export function IconeSushi({ className = base }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className={className} aria-hidden="true">
      <circle cx="7" cy="16.5" r="4" />
      <circle cx="7" cy="16.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="16.5" r="4" />
      <circle cx="14.5" cy="16.5" r="1.4" fill="currentColor" stroke="none" />
      <path d="M15.5 9l3.5-6" />
      <path d="M18.5 9l3.5-6" />
    </svg>
  );
}

export function IconeTacas({ className = base }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 3h6l-.9 6.3a2.1 2.1 0 0 1-2.1 1.8 2.1 2.1 0 0 1-2.1-1.8L5 3Z" transform="rotate(-16 8 6)" />
      <path d="M8 11v6" transform="rotate(-16 8 6)" />
      <path d="M5.6 19.5h5" transform="rotate(-16 8 6)" />
      <path d="M13 6h6l-.9 6.3a2.1 2.1 0 0 1-2.1 1.8 2.1 2.1 0 0 1-2.1-1.8L13 6Z" transform="rotate(16 16 9)" />
      <path d="M16 14v6" transform="rotate(16 16 9)" />
      <path d="M13.6 22.5h5" transform="rotate(16 16 9)" />
    </svg>
  );
}

export function IconeMoedas({ className = base }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={className} aria-hidden="true">
      <ellipse cx="9" cy="17" rx="6" ry="2.4" />
      <ellipse cx="9" cy="13.5" rx="6" ry="2.4" />
      <circle cx="16" cy="8" r="4.4" />
      <path d="M16 6v4M14.6 6.9h2.8a1 1 0 0 1 0 2H15a1 1 0 0 0 0 2h2.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconePilula({ className = base }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className={className} aria-hidden="true">
      <rect x="3" y="9" width="18" height="6.5" rx="3.25" transform="rotate(-30 12 12)" />
      <path d="M11 8.6l2 3.8" transform="rotate(-30 12 12)" />
    </svg>
  );
}

export function IconePoltrona({ className = base }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 12V8.5a2.5 2.5 0 0 1 5 0V11" />
      <path d="M13 11V8.5a2.5 2.5 0 0 1 5 0V12" />
      <path d="M4.5 12h15v3a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2v-3Z" />
      <path d="M5.5 17v2.5M18.5 17v2.5" />
      <path d="M10 4.6c1-1.2 3-1.2 4 0-1.3.4-1.3 1.6 0 2-2-.4-3.3-.4-4 0-1.3-1.6.7-1.3 0-2Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconeFerramentas({ className = base }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M14 10l6.5 6.5a1.7 1.7 0 0 1-2.4 2.4L11.6 12.4" />
      <path d="M4 20l6-6" />
      <path d="M6.5 9.5l-3-3 2-2 3 3M5 6.5L9.5 2M3.5 8l1.7-1.7" />
    </svg>
  );
}

export function IconePresenteIcone({ className = base }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3.5" y="9.5" width="17" height="10" rx="1.2" />
      <path d="M3.5 13h17" />
      <path d="M12 9.5v10" />
      <path d="M8.5 9.5c-2.4 0-3.2-3.5-.8-4.2 2-.6 3.6 1.4 4.3 4.2" />
      <path d="M15.5 9.5c2.4 0 3.2-3.5.8-4.2-2-.6-3.6 1.4-4.3 4.2" />
    </svg>
  );
}
