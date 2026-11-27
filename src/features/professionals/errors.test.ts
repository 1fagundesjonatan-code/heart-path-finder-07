import { describe, expect, test } from "vitest";
import { ERROR_MESSAGES, mapInviteAuthError, mapProfessionalDbError } from "./errors";

describe("mapProfessionalDbError", () => {
  test("mapeia os códigos conhecidos", () => {
    expect(mapProfessionalDbError({ code: "42501" })).toBe(ERROR_MESSAGES.forbidden);
    expect(mapProfessionalDbError({ code: "23505" })).toBe(ERROR_MESSAGES.duplicateRegistry);
    expect(mapProfessionalDbError({ code: "22023", message: "user_is_staff" })).toBe(
      ERROR_MESSAGES.alreadyStaff,
    );
    expect(mapProfessionalDbError({ code: "22023", message: "already_professional" })).toBe(
      ERROR_MESSAGES.alreadyProfessional,
    );
    expect(mapProfessionalDbError({ code: "22023", message: "outro" })).toBe(
      ERROR_MESSAGES.invalidInput,
    );
  });

  test("código desconhecido ou ausente cai na mensagem genérica", () => {
    expect(mapProfessionalDbError({ code: "P0002" })).toBe(ERROR_MESSAGES.generic);
    expect(mapProfessionalDbError({})).toBe(ERROR_MESSAGES.generic);
  });
});

describe("mapInviteAuthError", () => {
  test("e-mail já existente", () => {
    expect(mapInviteAuthError({ code: "email_exists" })).toBe(ERROR_MESSAGES.emailExists);
  });

  test("e-mail recusado pelo Auth", () => {
    expect(mapInviteAuthError({ code: "email_address_invalid" })).toBe(ERROR_MESSAGES.invalidEmail);
  });

  test("limite de envio de e-mail", () => {
    expect(mapInviteAuthError({ code: "over_email_send_rate_limit" })).toBe(
      ERROR_MESSAGES.rateLimited,
    );
    expect(mapInviteAuthError({ status: 429 })).toBe(ERROR_MESSAGES.rateLimited);
  });

  test("demais erros", () => {
    expect(mapInviteAuthError({ code: "unexpected_failure" })).toBe(ERROR_MESSAGES.generic);
  });
});
