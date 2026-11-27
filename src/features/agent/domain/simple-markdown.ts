export type InlineNode = { kind: "text" | "bold" | "italic" | "code"; text: string };
export type MarkdownBlock =
  | { kind: "paragraph"; lines: InlineNode[][] }
  | { kind: "list"; ordered: boolean; items: InlineNode[][] };

const INLINE_PATTERN = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|`([^`\n]+)`/g;
const BULLET = /^\s*[-*]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

export function parseInline(source: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let cursor = 0;
  for (const match of source.matchAll(INLINE_PATTERN)) {
    if (match.index > cursor) nodes.push({ kind: "text", text: source.slice(cursor, match.index) });
    if (match[1] !== undefined) nodes.push({ kind: "bold", text: match[1] });
    else if (match[2] !== undefined) nodes.push({ kind: "italic", text: match[2] });
    else nodes.push({ kind: "code", text: match[3] ?? "" });
    cursor = match.index + match[0].length;
  }
  if (cursor < source.length) nodes.push({ kind: "text", text: source.slice(cursor) });
  return nodes;
}

/** Subconjunto seguro de Markdown (sem HTML, sem links): parágrafos, listas, negrito, itálico, código. */
export function parseSimpleMarkdown(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  for (const chunk of source.split(/\n\s*\n/)) {
    const lines = chunk.split("\n").filter((line) => line.trim() !== "");
    if (lines.length === 0) continue;

    const listKind = lines.every((l) => BULLET.test(l))
      ? false
      : lines.every((l) => NUMBERED.test(l))
        ? true
        : null;
    if (listKind === null) {
      blocks.push({ kind: "paragraph", lines: lines.map((line) => parseInline(line.trim())) });
      continue;
    }
    const pattern = listKind ? NUMBERED : BULLET;
    blocks.push({
      kind: "list",
      ordered: listKind,
      items: lines.map((line) => parseInline(pattern.exec(line)?.[1] ?? line)),
    });
  }
  return blocks;
}
