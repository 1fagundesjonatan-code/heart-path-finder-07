import { describe, expect, test } from "vitest";
import {
  inviteProfessionalSchema,
  setVerificationSchema,
  updateProfessionalSchema,
} from "./schemas";

const valid = {
  email: "  Ana@Example.COM ",
  fullName: " Ana Souza ",
  registryCouncil: "CRP",
  registryNumber: "06/12345",
  registryState: "SP",
  specialties: ["Terapia cognitiva"],
  bio: "",
};

const userId = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

describe("inviteProfessionalSchema", () => {
  test("normaliza e-mail e espaços", () => {
    const parsed = inviteProfessionalSchema.parse(valid);
    expect(parsed.email).toBe("ana@example.com");
    expect(parsed.fullName).toBe("Ana Souza");
  });

  test.each([
    ["e-mail inválido", { email: "ana" }],
    ["nome vazio", { fullName: "  " }],
    ["conselho inválido", { registryCouncil: "CRO" }],
    ["número com caractere inválido", { registryNumber: "12 34" }],
    ["número longo demais", { registryNumber: "1".repeat(21) }],
    ["UF inexistente", { registryState: "XX" }],
    ["UF minúscula", { registryState: "sp" }],
    ["mais de 10 especialidades", { specialties: Array.from({ length: 11 }, (_, i) => `e${i}`) }],
    ["bio acima de 2000", { bio: "a".repeat(2001) }],
  ])("rejeita %s", (_name, patch) => {
    expect(inviteProfessionalSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});

describe("updateProfessionalSchema", () => {
  test("exige userId uuid", () => {
    expect(updateProfessionalSchema.safeParse({ ...valid, userId: "x" }).success).toBe(false);
    expect(updateProfessionalSchema.safeParse({ ...valid, userId }).success).toBe(true);
  });
});

describe("setVerificationSchema", () => {
  test("rejeição exige nota", () => {
    expect(setVerificationSchema.safeParse({ userId, status: "rejected", note: " " }).success).toBe(
      false,
    );
    expect(
      setVerificationSchema.safeParse({
        userId,
        status: "rejected",
        note: "Registro não localizado",
      }).success,
    ).toBe(true);
  });

  test("verificação aceita nota vazia", () => {
    expect(setVerificationSchema.safeParse({ userId, status: "verified", note: "" }).success).toBe(
      true,
    );
  });
});
