import { describe, expect, test } from "vitest";
import { canSeeFunnel } from "./access";

describe("canSeeFunnel", () => {
  test.each([["admin"], ["collaborator"]] as const)("%s vê o funil", (role) => {
    expect(canSeeFunnel([role])).toBe(true);
  });

  test("parceiro e cliente não veem o funil", () => {
    expect(canSeeFunnel(["partner"])).toBe(false);
    expect(canSeeFunnel(["client"])).toBe(false);
    expect(canSeeFunnel([])).toBe(false);
  });

  test("vários papéis: basta um permitido", () => {
    expect(canSeeFunnel(["partner", "collaborator"])).toBe(true);
  });
});
