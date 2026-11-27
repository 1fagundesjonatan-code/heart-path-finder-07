export const ERROR_MESSAGES = {
  forbidden: "Você não tem permissão para esta ação.",
  duplicateRegistry: "Já existe um profissional com esse registro (conselho, UF e número).",
  emailExists: "Já existe uma conta com esse e-mail.",
  alreadyStaff: "Esse e-mail pertence à equipe e não pode virar profissional.",
  alreadyProfessional: "Esse usuário já é um profissional.",
  invalidEmail: "O Supabase recusou esse e-mail. Confira o endereço.",
  rateLimited: "Limite de e-mails do Supabase atingido. Aguarde alguns minutos e tente de novo.",
  invalidInput: "Dados inválidos. Revise os campos.",
  generic: "Não foi possível concluir a ação. Tente de novo.",
} as const;

type PostgresLikeError = { code?: string | null; message?: string | null };

/** Erros de admin_register_professional e de updates na tabela professionals. */
export function mapProfessionalDbError(error: PostgresLikeError): string {
  switch (error.code) {
    case "42501":
      return ERROR_MESSAGES.forbidden;
    case "23505":
      return ERROR_MESSAGES.duplicateRegistry;
    case "22023":
      if (error.message?.includes("user_is_staff")) return ERROR_MESSAGES.alreadyStaff;
      if (error.message?.includes("already_professional"))
        return ERROR_MESSAGES.alreadyProfessional;
      return ERROR_MESSAGES.invalidInput;
    case "23514":
      return ERROR_MESSAGES.invalidInput;
    default:
      return ERROR_MESSAGES.generic;
  }
}

type AuthLikeError = { code?: string | null; status?: number | null };

/** Erros de auth.admin.inviteUserByEmail. */
export function mapInviteAuthError(error: AuthLikeError): string {
  if (error.code === "email_exists" || error.code === "user_already_exists") {
    return ERROR_MESSAGES.emailExists;
  }
  if (error.code === "email_address_invalid") return ERROR_MESSAGES.invalidEmail;
  if (error.code === "over_email_send_rate_limit" || error.status === 429) {
    return ERROR_MESSAGES.rateLimited;
  }
  return ERROR_MESSAGES.generic;
}
