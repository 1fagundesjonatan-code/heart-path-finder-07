import { describe, expect, test } from "vitest";
import { parseInline, parseSimpleMarkdown } from "./simple-markdown";

describe("parseInline", () => {
  test("negrito, itálico e código", () => {
    expect(parseInline("a **b** *c* `d`")).toEqual([
      { kind: "text", text: "a " },
      { kind: "bold", text: "b" },
      { kind: "text", text: " " },
      { kind: "italic", text: "c" },
      { kind: "text", text: " " },
      { kind: "code", text: "d" },
    ]);
  });

  test("marcador sem fechamento vira texto (stream parcial)", () => {
    expect(parseInline("olá **parc")).toEqual([{ kind: "text", text: "olá **parc" }]);
  });
});

describe("parseSimpleMarkdown", () => {
  test("separa parágrafos por linha em branco", () => {
    const blocks = parseSimpleMarkdown("um\n\ndois");
    expect(blocks.map((b) => b.kind)).toEqual(["paragraph", "paragraph"]);
  });

  test("lista com marcadores e numerada", () => {
    const blocks = parseSimpleMarkdown("- a\n- b\n\n1. x\n2. y");
    expect(blocks).toEqual([
      {
        kind: "list",
        ordered: false,
        items: [[{ kind: "text", text: "a" }], [{ kind: "text", text: "b" }]],
      },
      {
        kind: "list",
        ordered: true,
        items: [[{ kind: "text", text: "x" }], [{ kind: "text", text: "y" }]],
      },
    ]);
  });

  test("não interpreta HTML: tags ficam como texto", () => {
    const [block] = parseSimpleMarkdown("<script>x</script>");
    expect(block).toEqual({
      kind: "paragraph",
      lines: [[{ kind: "text", text: "<script>x</script>" }]],
    });
  });

  test("texto vazio não gera blocos", () => {
    expect(parseSimpleMarkdown("  \n ")).toEqual([]);
  });
});
