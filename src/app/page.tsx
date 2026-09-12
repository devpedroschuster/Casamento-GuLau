import Nav from "./components/nav";
import Hero from "./components/hero";
import Filete from "./components/filete";
import FotoDestaque from "./components/foto-destaque";
import Historia from "./components/historia";
import Galeria from "./components/galeria";
import Informacoes from "./components/informacoes";
import Countdown from "./components/countdown";
import ComoChegar from "./components/como-chegar";
import ListaPresentes from "./components/lista-presentes";
import BuscaConvite from "./busca-convite";

export default function Home() {
  return (
    <main className="min-h-screen relative">
      <Nav />
      <Hero />
      <FotoDestaque />
      <Filete className="my-2" />
      <Historia />
      <Filete className="my-2" />
      <Galeria />
      <Filete className="my-2" />
      <Informacoes />
      <Filete className="my-2" />
      <Countdown />
      <Filete className="my-2" />
      <ComoChegar />
      <Filete className="my-2" />
      <ListaPresentes />
      <Filete className="my-2" />
      <BuscaConvite />
    </main>
  );
}
