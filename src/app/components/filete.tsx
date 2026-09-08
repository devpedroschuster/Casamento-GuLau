/** Filete ornamental: filigrana com uma pequena centelha ao centro, no lugar
    de uma <hr> simples entre as seções do site. */
export default function Filete({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`filete ${className}`.trim()}
      viewBox="0 0 240 34"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        <path d="M40 17h58M142 17h58" />
        <path d="M40 17c-7 0-7-6-12-6-4 0-6 3.2-3.4 4.9 1.6 1 4-.3 4-1.9 0-2.4-3.2-4-7-4" />
        <path d="M200 17c7 0 7-6 12-6 4 0 6 3.2 3.4 4.9-1.6 1-4-.3-4-1.9 0-2.4 3.2-4 7-4" />
      </g>
      <path
        d="M120 7 121.8 14.2 129 16 121.8 17.8 120 25 118.2 17.8 111 16 118.2 14.2Z"
        fill="currentColor"
      />
    </svg>
  );
}
