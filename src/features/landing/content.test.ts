import { describe, expect, it } from "vitest";
import { landingContent } from "./content";

function findPlaceholders(value: unknown): string[] {
  if (typeof value === "string") return value.includes("[") ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(findPlaceholders);
  if (value && typeof value === "object") return Object.values(value).flatMap(findPlaceholders);
  return [];
}

describe("landing content placeholders", () => {
  it("finds bracketed placeholders in nested content", () => {
    expect(findPlaceholders({ a: ["ok", "[x]"], b: { c: "[y]" }, d: 1 })).toEqual(["[x]", "[y]"]);
    expect(findPlaceholders({ a: "pronto" })).toEqual([]);
  });

  // Gate de publicação: rodar `NODE_ENV=production vitest run` antes de publicar a landing.
  it.runIf(process.env.NODE_ENV === "production")("has no placeholder left for release", () => {
    expect(findPlaceholders(landingContent)).toEqual([]);
  });
});

describe("landing audience", () => {
  it("talks only to end clients, with no partner acquisition copy", () => {
    const copy = JSON.stringify(landingContent).toLowerCase();
    expect(copy).not.toMatch(/parceir|sou profissional|para profissionais|\/profissionais/);
    expect(landingContent.nav.map((item) => item.id)).not.toContain("profissionais");
  });
});
