import { describe, expect, test } from "vitest";
import {
  addDays,
  isValidYmd,
  pickBucket,
  resolvePeriod,
  toBusinessYmd,
  validateCustomRange,
} from "./period";

// 2026-11-24 02:00 UTC = 2026-11-23 23:00 em São Paulo
const lateNight = new Date("2026-11-24T02:00:00Z");
const noon = new Date("2026-11-24T15:00:00Z");

describe("toBusinessYmd", () => {
  test("usa o dia de São Paulo, não o UTC", () => {
    expect(toBusinessYmd(lateNight)).toBe("2026-11-23");
    expect(toBusinessYmd(noon)).toBe("2026-11-24");
  });
});

describe("resolvePeriod", () => {
  test("hoje cobre o dia inteiro, semiaberto", () => {
    const p = resolvePeriod("today", noon);
    expect(p).toMatchObject({
      from: "2026-11-24T00:00:00-03:00",
      to: "2026-11-25T00:00:00-03:00",
    });
  });

  test("7 dias inclui hoje e os 6 anteriores", () => {
    expect(resolvePeriod("7d", noon)?.firstDay).toBe("2026-11-18");
  });

  test("30 e 90 dias", () => {
    expect(resolvePeriod("30d", noon)?.firstDay).toBe("2026-10-26");
    expect(resolvePeriod("90d", noon)?.firstDay).toBe("2026-08-27");
  });

  test("12 meses começa no dia 1 do mês de 11 meses atrás, atravessando o ano", () => {
    expect(resolvePeriod("12m", noon)?.firstDay).toBe("2025-12-01");
    expect(resolvePeriod("12m", new Date("2026-02-10T12:00:00Z"))?.firstDay).toBe("2025-03-01");
  });

  test("personalizado usa o último dia como inclusivo", () => {
    const p = resolvePeriod("custom", noon, { from: "2026-01-01", to: "2026-01-31" });
    expect(p?.to).toBe("2026-02-01T00:00:00-03:00");
  });

  test("personalizado inválido ou invertido retorna null", () => {
    expect(resolvePeriod("custom", noon)).toBeNull();
    expect(resolvePeriod("custom", noon, { from: "2026-02-01", to: "2026-01-01" })).toBeNull();
    expect(resolvePeriod("custom", noon, { from: "2026-02-30", to: "2026-03-01" })).toBeNull();
  });
});

describe("intervalo personalizado longo demais", () => {
  test("rejeita mais de 800 dias, com mensagem", () => {
    const range = { from: "2020-01-01", to: "2026-01-01" };
    expect(resolvePeriod("custom", noon, range)).toBeNull();
    expect(validateCustomRange(range)).toContain("800");
  });

  test("aceita exatamente 800 dias", () => {
    const range = { from: "2024-01-01", to: addDays("2024-01-01", 799) };
    expect(validateCustomRange(range)).toBeNull();
    expect(resolvePeriod("custom", noon, range)).not.toBeNull();
  });
});

describe("helpers", () => {
  test("addDays atravessa mês e ano", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  test("isValidYmd rejeita datas impossíveis", () => {
    expect(isValidYmd("2026-02-29")).toBe(false);
    expect(isValidYmd("2028-02-29")).toBe(true);
    expect(isValidYmd("26-1-1")).toBe(false);
  });

  test("pickBucket escolhe granularidade pelo tamanho do período", () => {
    const day = resolvePeriod("30d", noon)!;
    const week = resolvePeriod("90d", noon)!;
    const month = resolvePeriod("12m", noon)!;
    expect(pickBucket(day.from, day.to)).toBe("day");
    expect(pickBucket(week.from, week.to)).toBe("week");
    expect(pickBucket(month.from, month.to)).toBe("month");
  });
});
