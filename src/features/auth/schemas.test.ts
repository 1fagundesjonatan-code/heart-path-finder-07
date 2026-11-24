import { describe, expect, test } from "vitest";
import { loginSchema, sanitizeNextPath } from "./schemas";

describe("sanitizeNextPath", () => {
  test("mantém caminhos internos", () => {
    expect(sanitizeNextPath("/admin/configuracoes/usuarios")).toBe("/admin/configuracoes/usuarios");
  });

  test("preserva query e hash", () => {
    expect(sanitizeNextPath("/admin?x=1#a")).toBe("/admin?x=1#a");
  });

  test.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
    "",
    42,
    null,
    "/\t/evil.com",
    "/\n/evil.com",
    "/\r/evil.com",
    decodeURIComponent("/%09/evil.com"),
    "/\u007f/x",
  ])("descarta %s", (value) => {
    expect(sanitizeNextPath(value)).toBe("/admin");
  });
});

describe("loginSchema", () => {
  test("normaliza e-mail", () => {
    expect(loginSchema.parse({ email: "  Ana@Exemplo.COM ", password: "x" }).email).toBe(
      "ana@exemplo.com",
    );
  });

  test("rejeita e-mail inválido e senha vazia", () => {
    expect(loginSchema.safeParse({ email: "abc", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});
