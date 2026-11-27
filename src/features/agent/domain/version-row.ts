import type { AgentVersion, AgentVersionStatus } from "../types";

export type AgentVersionRow = {
  id: number;
  version: number;
  status: string;
  label: string | null;
  model: string;
  persona: string;
  type_guides: unknown;
  max_output_tokens: number;
  knowledge_enabled: boolean;
  created_at: string;
  created_by: string | null;
  published_at: string | null;
  published_by: string | null;
};

function isStatus(value: string): value is AgentVersionStatus {
  return value === "draft" || value === "active" || value === "archived";
}

function toGuides(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

export function toAgentVersion(
  row: AgentVersionRow,
  names: ReadonlyMap<string, string>,
): AgentVersion {
  if (!isStatus(row.status)) throw new Error(`Status de versão desconhecido: ${row.status}`);
  return {
    id: row.id,
    version: row.version,
    status: row.status,
    label: row.label,
    model: row.model,
    createdAt: row.created_at,
    createdByName: row.created_by ? (names.get(row.created_by) ?? null) : null,
    publishedAt: row.published_at,
    publishedByName: row.published_by ? (names.get(row.published_by) ?? null) : null,
    persona: row.persona,
    typeGuides: toGuides(row.type_guides),
    maxOutputTokens: row.max_output_tokens,
    knowledgeEnabled: row.knowledge_enabled,
  };
}
