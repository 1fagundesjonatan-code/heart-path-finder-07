import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/features/landing";

const TITLE = "The Self Map | Autoconhecimento com método";
const DESCRIPTION =
  "Comece com um teste de Eneagrama gratuito e continue com mentor de IA, tarefas, foco e profissionais de verdade. The Self Map, do The Self Institute.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: LandingPage,
});
