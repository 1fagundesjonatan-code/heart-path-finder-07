import { describe, expect, test } from "vitest";
import { hasAnyRole, isAppRole, isStaff } from "./roles";

describe("roles", () => {
  test("client e partner não são staff", () => {
    expect(isStaff(["client"])).toBe(false);
    expect(isStaff(["partner", "client"])).toBe(false);
    expect(isStaff([])).toBe(false);
  });

  test("qualquer papel de staff basta", () => {
    expect(isStaff(["client", "marketing"])).toBe(true);
  });

  test("hasAnyRole respeita a lista permitida", () => {
    expect(hasAnyRole(["operator"], ["admin"])).toBe(false);
    expect(hasAnyRole(["operator"], ["admin", "operator"])).toBe(true);
  });

  test("isAppRole rejeita valores desconhecidos", () => {
    expect(isAppRole("admin")).toBe(true);
    expect(isAppRole("root")).toBe(false);
    expect(isAppRole(undefined)).toBe(false);
  });
});
