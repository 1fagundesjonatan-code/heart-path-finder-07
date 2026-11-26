import { createFileRoute } from "@tanstack/react-router";
import { EnneagramTest } from "@/features/eneagrama";

const TITLE = "Teste de Eneagrama gratuito | The Self Map";

export const Route = createFileRoute("/eneagrama")({
  head: () => ({
    meta: [
      { title: TITLE },
      {
        name: "description",
        content:
          "Um teste reflexivo de 162 afirmações para revelar seu tipo de eneagrama. Gratuito, com resultado imediato. The Self Map, do The Self Institute.",
      },
      { property: "og:title", content: TITLE },
      {
        property: "og:description",
        content:
          "162 afirmações em escala de 1 a 5 para mapear seu tipo, asas e direções de estresse e segurança.",
      },
    ],
  }),
  component: EnneagramTest,
});
