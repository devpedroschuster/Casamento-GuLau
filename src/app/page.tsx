import Nav from "./components/nav";
import Hero from "./components/hero";
import Filete from "./components/filete";
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
      <Filete className="my-2" />
      <Historia />
      <Filete className="my-2" />
      <Informacoes />
      <Filete className="my-2" />
      <Countdown />
      <Filete className="my-2" />
      <ComoChegar />
      <Filete className="my-2" />
      <BuscaConvite />
    </main>
  );
}
