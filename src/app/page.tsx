import BuscaConvite from "./busca-convite";

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-neutral-900 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/fundo-convite.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative max-w-md w-full">
        <BuscaConvite />
      </div>
    </main>
  );
}
