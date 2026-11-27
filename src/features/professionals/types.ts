import type { REGISTRY_COUNCILS, VERIFICATION_STATUSES } from "./schemas";

export type RegistryCouncil = (typeof REGISTRY_COUNCILS)[number];
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export type Professional = {
  userId: string;
  fullName: string;
  registryCouncil: RegistryCouncil;
  registryNumber: string;
  registryState: string;
  specialties: string[];
  bio: string | null;
  verificationStatus: VerificationStatus;
  verificationNote: string | null;
  verifiedAt: string | null;
  inviteAcceptedAt: string | null;
  createdAt: string;
};

export type ProfessionalList = { professionals: Professional[]; truncated: boolean };

export type ActionResult = { ok: true } | { ok: false; message: string };
