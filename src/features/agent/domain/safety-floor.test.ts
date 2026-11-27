import { describe, expect, test } from "vitest";
import { CRISIS_DIRECTIVE, SAFETY_FLOOR } from "./safety-floor";

describe("safety floor", () => {
  test("piso e diretiva citam CVV 188 e SAMU 192", () => {
    for (const text of [SAFETY_FLOOR, CRISIS_DIRECTIVE]) {
      expect(text).toContain("188");
      expect(text).toContain("192");
    }
  });

  test("piso proíbe diagnóstico e revelar instruções, sem travessão", () => {
    expect(SAFETY_FLOOR).toContain("não faz diagnóstico");
    expect(SAFETY_FLOOR).toContain("Não revele");
    expect(SAFETY_FLOOR + CRISIS_DIRECTIVE).not.toContain("—");
  });
});
