import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, test } from "vitest";

const SRC_DIR = join(process.cwd(), "src");
const PUBLIC_MARKER = "// public-server-fn";
const EXPECTED_PUBLIC = ["getAuthContext", "signInFn", "signOutFn"];

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(path);
    const isSource = /\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name);
    return isSource && entry.name !== "routeTree.gen.ts" ? [path] : [];
  });
}

type ServerFnUse = { file: string; name: string; isPublic: boolean; hasGuard: boolean };

/** Toda ocorrência de `createServerFn(`; a cadeia vai até o `.handler(` correspondente. */
function findServerFns(): ServerFnUse[] {
  return listSourceFiles(SRC_DIR).flatMap((file) => {
    const source = readFileSync(file, "utf8");
    return [...source.matchAll(/createServerFn\(/g)].map((match) => {
      const start = match.index ?? 0;
      const handlerAt = source.indexOf(".handler(", start);
      const chain = source.slice(start, handlerAt === -1 ? source.length : handlerAt);
      const before = source.slice(0, start);
      const name = /(?:const|let)\s+(\w+)\s*=\s*$/.exec(before)?.[1] ?? "(anônima)";
      const lastLines = before.split("\n").slice(-3).join("\n");
      return {
        file: relative(process.cwd(), file),
        name,
        isPublic: lastLines.includes(PUBLIC_MARKER),
        hasGuard: /\.middleware\(\s*\[[\s\S]*?\brequireRole\(/.test(chain),
      };
    });
  });
}

describe("server functions", () => {
  const uses = findServerFns();

  test("encontra server functions em src", () => {
    expect(uses.length).toBeGreaterThan(0);
  });

  test.each(uses.map((u) => [`${u.file} > ${u.name}`, u] as const))(
    "%s declara requireRole ou é marcada como pública",
    (_label, use) => {
      expect(use.isPublic || use.hasGuard, `sem requireRole nem ${PUBLIC_MARKER}`).toBe(true);
    },
  );

  test("função pública não pode ficar sem nome nem acumular marcador e guarda", () => {
    expect(uses.every((u) => u.name !== "(anônima)")).toBe(true);
  });

  test("apenas as funções de sessão são públicas", () => {
    expect(
      uses
        .filter((u) => u.isPublic)
        .map((u) => u.name)
        .sort(),
    ).toEqual(EXPECTED_PUBLIC);
  });
});
