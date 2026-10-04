import type { Metadata, Viewport } from "next";
import ConviteReplica from "./convite-replica/convite-replica";

export const metadata: Metadata = {
  title: "Laura & Gustavo — O Casamento",
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function Home() {
  return <ConviteReplica />;
}
