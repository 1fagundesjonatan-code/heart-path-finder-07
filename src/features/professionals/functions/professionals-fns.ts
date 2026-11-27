import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { requireRole } from "@/features/auth/functions/require-role";
import { createServiceRoleClient } from "@/integrations/supabase/admin-client.server";
import { readRaw } from "@/integrations/supabase/env.server";
import type { Database } from "@/integrations/supabase/types";
import { ERROR_MESSAGES, mapInviteAuthError, mapProfessionalDbError } from "../errors";
import { INVITE_ACCEPT_READY, INVITE_DISABLED_MESSAGE } from "../invite-config";
import {
  inviteProfessionalSchema,
  listProfessionalsSchema,
  setVerificationSchema,
  updateProfessionalSchema,
} from "../schemas";
import type { ActionResult, Professional, ProfessionalList } from "../types";

const LIST_LIMIT = 200;
const COLUMNS =
  "user_id, full_name, registry_council, registry_number, registry_state, specialties, bio, verification_status, verification_note, verified_at, invite_accepted_at, created_at";

type Row = Pick<
  Database["public"]["Tables"]["professionals"]["Row"],
  | "user_id"
  | "full_name"
  | "registry_council"
  | "registry_number"
  | "registry_state"
  | "specialties"
  | "bio"
  | "verification_status"
  | "verification_note"
  | "verified_at"
  | "invite_accepted_at"
  | "created_at"
>;

function toProfessional(row: Row): Professional {
  return {
    userId: row.user_id,
    fullName: row.full_name,
    registryCouncil: row.registry_council as Professional["registryCouncil"],
    registryNumber: row.registry_number,
    registryState: row.registry_state,
    specialties: row.specialties,
    bio: row.bio,
    verificationStatus: row.verification_status as Professional["verificationStatus"],
    verificationNote: row.verification_note,
    verifiedAt: row.verified_at,
    inviteAcceptedAt: row.invite_accepted_at,
    createdAt: row.created_at,
  };
}

/** Leitura direta na tabela com o JWT do usuário: a RLS (is_staff) é quem autoriza. */
export const listProfessionalsFn = createServerFn({ method: "GET" })
  .middleware([requireRole(["admin", "collaborator"])])
  .inputValidator((data: unknown) => listProfessionalsSchema.parse(data))
  .handler(async ({ data, context }): Promise<ProfessionalList> => {
    let query = context.supabase
      .from("professionals")
      .select(COLUMNS)
      .order("created_at", { ascending: false })
      .order("user_id")
      .limit(LIST_LIMIT + 1);
    if (data.status) query = query.eq("verification_status", data.status);

    const { data: rows, error } = await query;
    if (error) {
      console.error("listProfessionals: falha", { code: error.code });
      throw new Error("Não foi possível listar os profissionais.", { cause: error });
    }
    return {
      professionals: rows.slice(0, LIST_LIMIT).map(toProfessional),
      truncated: rows.length > LIST_LIMIT,
    };
  });

function resolveInviteRedirect(): string {
  return readRaw("PROFESSIONAL_INVITE_REDIRECT_URL") ?? `${getRequestUrl().origin}/aceitar-convite`;
}

/**
 * Convite em dois passos. O único uso de service role é auth.admin (convidar e, em caso de falha,
 * remover o usuário órfão). A escalada de papel e a ficha passam pela RPC com o JWT do admin.
 */
export const inviteProfessionalFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin"])])
  .inputValidator((data: unknown) => inviteProfessionalSchema.parse(data))
  .handler(async ({ data, context }): Promise<ActionResult> => {
    if (!INVITE_ACCEPT_READY) return { ok: false, message: INVITE_DISABLED_MESSAGE };

    const existing = await context.supabase
      .from("professionals")
      .select("user_id", { count: "exact", head: true })
      .eq("registry_council", data.registryCouncil)
      .eq("registry_number", data.registryNumber)
      .eq("registry_state", data.registryState);
    if (existing.error) {
      console.error("inviteProfessional: falha ao checar duplicado", { code: existing.error.code });
      return { ok: false, message: ERROR_MESSAGES.generic };
    }
    if (existing.count) {
      return { ok: false, message: ERROR_MESSAGES.duplicateRegistry };
    }

    const service = createServiceRoleClient();

    const invited = await service.auth.admin.inviteUserByEmail(data.email, {
      data: { full_name: data.fullName },
      redirectTo: resolveInviteRedirect(),
    });
    if (invited.error || !invited.data.user) {
      console.error("inviteProfessional: falha ao convidar", {
        code: invited.error?.code,
        status: invited.error?.status,
      });
      return {
        ok: false,
        message: invited.error ? mapInviteAuthError(invited.error) : ERROR_MESSAGES.generic,
      };
    }
    const newUserId = invited.data.user.id;

    const { error } = await context.supabase.rpc("admin_register_professional", {
      p_user_id: newUserId,
      p_full_name: data.fullName,
      p_registry_council: data.registryCouncil,
      p_registry_number: data.registryNumber,
      p_registry_state: data.registryState,
      p_specialties: data.specialties,
      p_bio: data.bio || undefined,
    });
    if (!error) return { ok: true };

    console.error("inviteProfessional: falha na RPC", { code: error.code });
    const cleanup = await service.auth.admin.deleteUser(newUserId);
    if (cleanup.error) {
      console.error("inviteProfessional: usuário órfão não removido", {
        userId: newUserId,
        code: cleanup.error.code,
      });
    }
    return { ok: false, message: mapProfessionalDbError(error) };
  });

export const updateProfessionalFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin", "collaborator"])])
  .inputValidator((data: unknown) => updateProfessionalSchema.parse(data))
  .handler(async ({ data, context }): Promise<ActionResult> => {
    const { error, count } = await context.supabase
      .from("professionals")
      .update(
        {
          full_name: data.fullName,
          registry_council: data.registryCouncil,
          registry_number: data.registryNumber,
          registry_state: data.registryState,
          specialties: data.specialties,
          bio: data.bio || null,
        },
        { count: "exact" },
      )
      .eq("user_id", data.userId);

    if (error) {
      console.error("updateProfessional: falha", { code: error.code });
      return { ok: false, message: mapProfessionalDbError(error) };
    }
    if (!count) return { ok: false, message: "Profissional não encontrado." };
    return { ok: true };
  });

export const setVerificationFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin"])])
  .inputValidator((data: unknown) => setVerificationSchema.parse(data))
  .handler(async ({ data, context }): Promise<ActionResult> => {
    const { error, count } = await context.supabase
      .from("professionals")
      .update(
        { verification_status: data.status, verification_note: data.note || null },
        { count: "exact" },
      )
      .eq("user_id", data.userId);

    if (error) {
      console.error("setVerification: falha", { code: error.code });
      return { ok: false, message: mapProfessionalDbError(error) };
    }
    if (!count) return { ok: false, message: "Profissional não encontrado." };
    return { ok: true };
  });
