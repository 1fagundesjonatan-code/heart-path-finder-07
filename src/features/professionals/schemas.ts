import { z } from "zod";

export const REGISTRY_COUNCILS = ["CRP", "CRM", "OTHER"] as const;
export const VERIFICATION_STATUSES = ["pending", "verified", "rejected"] as const;
export const BR_STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export const MAX_SPECIALTIES = 10;

export const professionalFieldsSchema = z.object({
  fullName: z.string().trim().min(1, "Obrigatório.").max(120, "Máximo de 120 caracteres."),
  registryCouncil: z.enum(REGISTRY_COUNCILS),
  registryNumber: z
    .string()
    .trim()
    .regex(
      /^[0-9A-Za-z./-]{1,20}$/,
      "Use até 20 caracteres: letras, números, ponto, barra ou hífen.",
    ),
  registryState: z.enum(BR_STATES),
  specialties: z
    .array(z.string().trim().min(1).max(60))
    .max(MAX_SPECIALTIES, `Máximo de ${MAX_SPECIALTIES} especialidades.`),
  bio: z.string().trim().max(2000, "Máximo de 2000 caracteres."),
});
export type ProfessionalFields = z.infer<typeof professionalFieldsSchema>;

export const inviteProfessionalSchema = professionalFieldsSchema.extend({
  email: z.string().trim().toLowerCase().email("E-mail inválido.").max(254),
});
export type InviteProfessionalInput = z.infer<typeof inviteProfessionalSchema>;

export const updateProfessionalSchema = professionalFieldsSchema.extend({
  userId: z.string().uuid(),
});
export type UpdateProfessionalInput = z.infer<typeof updateProfessionalSchema>;

export const setVerificationSchema = z
  .object({
    userId: z.string().uuid(),
    status: z.enum(VERIFICATION_STATUSES),
    note: z.string().trim().max(500, "Máximo de 500 caracteres."),
  })
  .refine((v) => v.status !== "rejected" || v.note.length > 0, {
    message: "Informe o motivo da rejeição.",
    path: ["note"],
  });
export type SetVerificationInput = z.infer<typeof setVerificationSchema>;

export const listProfessionalsSchema = z.object({
  status: z.enum(VERIFICATION_STATUSES).optional(),
});
export type ListProfessionalsInput = z.infer<typeof listProfessionalsSchema>;
