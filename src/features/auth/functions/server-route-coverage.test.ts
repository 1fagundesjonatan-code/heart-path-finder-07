import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, test } from "vitest";

const ROUTES_DIR = join(process.cwd(), "src", "routes");
const PUBLIC_MARKER = "// public-server-route";
const EXPECTED_PUBLIC: string[] = [];

function listRouteFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listRouteFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

/** Rotas de servidor = arquivos de rota que declaram `server:` com `handlers`. */
const serverRoutes = listRouteFiles(ROUTES_DIR)
  .map((file) => ({ file: relative(process.cwd(), file), source: readFileSync(file, "utf8") }))
  .filter(({ source }) => /\bhandlers\s*:/.test(source));

describe("rotas de servidor", () => {
  test("encontra ao menos uma rota de servidor", () => {
    expect(serverRoutes.length).toBeGreaterThan(0);
  });

  test.each(serverRoutes.map((r) => [r.file, r] as const))(
    "%s chama authorizeRequest ou é marcada como pública",
    (_file, route) => {
      const guarded = /\bauthorizeRequest\(/.test(route.source);
      const isPublic = route.source.includes(PUBLIC_MARKER);
      expect(guarded || isPublic, `sem authorizeRequest nem ${PUBLIC_MARKER}`).toBe(true);
      expect(guarded && isPublic, "não pode ter guarda e marcador público juntos").toBe(false);
    },
  );

  test("apenas as rotas esperadas são públicas", () => {
    expect(serverRoutes.filter((r) => r.source.includes(PUBLIC_MARKER)).map((r) => r.file)).toEqual(
      EXPECTED_PUBLIC,
    );
  });
});
