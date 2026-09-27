import Nav from "./components/nav";
import Hero from "./components/hero";
import Filete from "./components/filete";
import FotoDestaque from "./components/foto-destaque";
import Historia from "./components/historia";
import Galeria from "./components/galeria";
import Informacoes from "./components/informacoes";
import DressCode from "./components/dress-code";
import MakesCabelos from "./components/makes-cabelos";
import Countdown from "./components/countdown";
import ComoChegar from "./components/como-chegar";
import AfterInfo from "./components/after-info";
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
      <DressCode />
      <Filete className="my-2" />
      <MakesCabelos />
      <Filete className="my-2" />
      <Countdown />
      <Filete className="my-2" />
      <ComoChegar />
      <Filete className="my-2" />
      <AfterInfo />
      <Filete className="my-2" />
      <ListaPresentes />
      <Filete className="my-2" />
      <BuscaConvite />
    </main>
  );
}
