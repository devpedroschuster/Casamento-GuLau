import Nav from "./components/nav";
import Hero from "./components/hero";
import Historia from "./components/historia";
import Informacoes from "./components/informacoes";
import Countdown from "./components/countdown";
import ComoChegar from "./components/como-chegar";
import BuscaConvite from "./busca-convite";

export default function Home() {
  return (
    <main className="min-h-screen relative">
      <Nav />
      <Hero />
      <Historia />
      <Informacoes />
      <Countdown />
      <ComoChegar />
      <BuscaConvite />
    </main>
  );
}
