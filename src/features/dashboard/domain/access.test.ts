import { describe, expect, test } from "vitest";
import { canSeeFunnel } from "./access";

describe("canSeeFunnel", () => {
  test.each([["admin"], ["operator"], ["marketing"]] as const)("%s vê o funil", (role) => {
    expect(canSeeFunnel([role])).toBe(true);
  });

  test("financeiro e cliente não veem o funil", () => {
    expect(canSeeFunnel(["finance"])).toBe(false);
    expect(canSeeFunnel(["client"])).toBe(false);
    expect(canSeeFunnel([])).toBe(false);
  });

  test("vários papéis: basta um permitido", () => {
    expect(canSeeFunnel(["finance", "marketing"])).toBe(true);
  });
});
