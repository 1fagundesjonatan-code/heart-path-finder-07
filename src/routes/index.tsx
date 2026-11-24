import { createFileRoute } from "@tanstack/react-router";
import { EnneagramTest } from "@/features/eneagrama";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Teste de Eneagrama — The Self Map" },
      {
        name: "description",
        content:
          "Um teste reflexivo de 162 afirmações para revelar seu tipo de eneagrama. Conduzido pelo The Self Map.",
      },
      { property: "og:title", content: "Teste de Eneagrama — The Self Map" },
      {
        property: "og:description",
        content:
          "162 afirmações em escala de 1 a 5 para mapear seu tipo, asas e direções de estresse e segurança.",
      },
    ],
  }),
  component: EnneagramTest,
});
