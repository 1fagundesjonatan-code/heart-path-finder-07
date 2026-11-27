import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireRole } from "@/features/auth/functions/require-role";
import type { Database } from "@/integrations/supabase/types";
import {
  STARTER_MAX_OUTPUT_TOKENS,
  STARTER_MODEL,
  STARTER_PERSONA,
} from "../domain/starter-version";
import { toAgentVersion, type AgentVersionRow } from "../domain/version-row";
import { createDraftSchema, updateDraftSchema, versionIdSchema } from "../schemas";
import type {
  AgentVersion,
  AgentVersionSummary,
  DeleteVersionResult,
  VersionActionResult,
} from "../types";

type Client = SupabaseClient<Database>;

const COLUMNS =
  "id, version, status, label, model, persona, type_guides, max_output_tokens, knowledge_enabled, created_at, created_by, published_at, published_by";
const MAX_INSERT_ATTEMPTS = 3;

async function loadNames(supabase: Client, rows: readonly AgentVersionRow[]) {
  const ids = [
    ...new Set(rows.flatMap((r) => [r.created_by, r.published_by]).filter((id) => id !== null)),
  ];
  const names = new Map<string, string>();
  if (ids.length === 0) return names;
  const { data, error } = await supabase.from("profiles").select("id, full_name").in("id", ids);
  if (error) {
    console.error("agent versions: falha ao ler profiles", { code: error.code });
    return names;
  }
  for (const p of data) if (p.full_name) names.set(p.id, p.full_name);
  return names;
}

async function fetchVersion(supabase: Client, id: number): Promise<AgentVersion | null> {
  const { data, error } = await supabase
    .from("ai_agent_versions")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("agent versions: falha ao ler versão", { id, code: error.code });
    throw new Error("Não foi possível ler a versão.", { cause: error });
  }
  return data ? toAgentVersion(data, await loadNames(supabase, [data])) : null;
}

async function respondWith(supabase: Client, id: number): Promise<VersionActionResult> {
  const version = await fetchVersion(supabase, id);
  return version ? { ok: true, version } : { ok: false, message: "Versão não encontrada." };
}

type DraftContent = Pick<
  AgentVersion,
  "label" | "persona" | "typeGuides" | "model" | "maxOutputTokens" | "knowledgeEnabled"
>;

/** Sem origem explícita copia a ativa (ordem alfabética do status: active vem antes); sem nenhuma, usa o texto inicial. */
async function resolveSource(supabase: Client, fromVersionId?: number): Promise<DraftContent> {
  const query = supabase.from("ai_agent_versions").select(COLUMNS);
  const { data, error } = fromVersionId
    ? await query.eq("id", fromVersionId).maybeSingle()
    : await query.order("status").order("version", { ascending: false }).limit(1).maybeSingle();
  if (error) {
    console.error("agent versions: falha ao ler origem do rascunho", { code: error.code });
    throw new Error("Não foi possível ler a versão de origem.", { cause: error });
  }
  if (data) return toAgentVersion(data, new Map());
  if (fromVersionId) throw new Error("Versão de origem não encontrada.");
  return {
    label: null,
    persona: STARTER_PERSONA,
    typeGuides: {},
    model: STARTER_MODEL,
    maxOutputTokens: STARTER_MAX_OUTPUT_TOKENS,
    knowledgeEnabled: true,
  };
}

async function insertDraft(
  supabase: Client,
  userId: string,
  fromVersionId?: number,
): Promise<VersionActionResult> {
  let source: DraftContent;
  try {
    source = await resolveSource(supabase, fromVersionId);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Falha ao criar." };
  }

  for (let attempt = 0; attempt < MAX_INSERT_ATTEMPTS; attempt++) {
    const latest = await supabase
      .from("ai_agent_versions")
      .select("version")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest.error) {
      console.error("agent versions: falha ao calcular número", { code: latest.error.code });
      return { ok: false, message: "Não foi possível criar o rascunho." };
    }

    const { data, error } = await supabase
      .from("ai_agent_versions")
      .insert({
        version: (latest.data?.version ?? 0) + 1,
        status: "draft",
        created_by: userId,
        label: source.label,
        persona: source.persona,
        type_guides: { ...source.typeGuides },
        model: source.model,
        max_output_tokens: source.maxOutputTokens,
        knowledge_enabled: source.knowledgeEnabled,
      })
      .select("id")
      .single();
    if (!error) return respondWith(supabase, data.id);
    // 23505: outra pessoa criou o mesmo número ao mesmo tempo; recalcula.
    if (error.code !== "23505") {
      console.error("agent versions: falha ao criar rascunho", { code: error.code });
      return { ok: false, message: "Não foi possível criar o rascunho." };
    }
  }
  return { ok: false, message: "Outra pessoa criou uma versão agora. Tente de novo." };
}

export const listAgentVersionsFn = createServerFn({ method: "GET" })
  .middleware([requireRole(["admin", "collaborator"])])
  .handler(async ({ context }): Promise<AgentVersionSummary[]> => {
    const { data, error } = await context.supabase
      .from("ai_agent_versions")
      .select(COLUMNS)
      .order("version", { ascending: false });
    if (error) {
      console.error("listAgentVersions: falha", { code: error.code });
      throw new Error("Não foi possível listar as versões.", { cause: error });
    }
    const names = await loadNames(context.supabase, data);
    return data.map((row) => {
      const full = toAgentVersion(row, names);
      return {
        id: full.id,
        version: full.version,
        status: full.status,
        label: full.label,
        model: full.model,
        createdAt: full.createdAt,
        createdByName: full.createdByName,
        publishedAt: full.publishedAt,
        publishedByName: full.publishedByName,
      };
    });
  });

export const getAgentVersionFn = createServerFn({ method: "GET" })
  .middleware([requireRole(["admin", "collaborator"])])
  .inputValidator((data: unknown) => versionIdSchema.parse(data))
  .handler(({ data, context }) => fetchVersion(context.supabase, data.id));

export const createDraftVersionFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin", "collaborator"])])
  .inputValidator((data: unknown) => createDraftSchema.parse(data))
  .handler(({ data, context }) =>
    insertDraft(context.supabase, context.userId, data.fromVersionId),
  );

export const duplicateVersionFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin", "collaborator"])])
  .inputValidator((data: unknown) => versionIdSchema.parse(data))
  .handler(({ data, context }) => insertDraft(context.supabase, context.userId, data.id));

export const updateDraftVersionFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin", "collaborator"])])
  .inputValidator((data: unknown) => updateDraftSchema.parse(data))
  .handler(async ({ data, context }): Promise<VersionActionResult> => {
    const { data: updated, error } = await context.supabase
      .from("ai_agent_versions")
      .update({
        label: data.label,
        persona: data.persona,
        type_guides: data.typeGuides,
        model: data.model,
        max_output_tokens: data.maxOutputTokens,
        knowledge_enabled: data.knowledgeEnabled,
      })
      .eq("id", data.id)
      .eq("status", "draft")
      .select("id");
    if (error) {
      console.error("updateDraftVersion: falha", { code: error.code });
      return { ok: false, message: "Não foi possível salvar o rascunho." };
    }
    if (updated.length === 0) {
      return {
        ok: false,
        message: "Só rascunhos podem ser editados. Duplique a versão para alterar.",
      };
    }
    return respondWith(context.supabase, data.id);
  });

export const publishVersionFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin"])])
  .inputValidator((data: unknown) => versionIdSchema.parse(data))
  .handler(async ({ data, context }): Promise<VersionActionResult> => {
    const { error } = await context.supabase.rpc("ai_publish_agent_version", {
      p_version_id: data.id,
    });
    if (error) {
      if (error.code === "P0002") return { ok: false, message: "Versão não encontrada." };
      if (error.code === "22023") return { ok: false, message: "Esta versão já está ativa." };
      console.error("publishVersion: falha", { code: error.code });
      return { ok: false, message: "Não foi possível publicar a versão." };
    }
    return respondWith(context.supabase, data.id);
  });

export const deleteDraftVersionFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin"])])
  .inputValidator((data: unknown) => versionIdSchema.parse(data))
  .handler(async ({ data, context }): Promise<DeleteVersionResult> => {
    const { error, count } = await context.supabase
      .from("ai_agent_versions")
      .delete({ count: "exact" })
      .eq("id", data.id)
      .eq("status", "draft");
    if (error) {
      if (error.code === "23503") {
        return {
          ok: false,
          message: "Este rascunho já tem conversas de teste e não pode ser apagado.",
        };
      }
      console.error("deleteDraftVersion: falha", { code: error.code });
      return { ok: false, message: "Não foi possível apagar o rascunho." };
    }
    if (!count) return { ok: false, message: "Só rascunhos podem ser apagados." };
    return { ok: true };
  });
