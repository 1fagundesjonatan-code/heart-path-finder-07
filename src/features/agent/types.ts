export type EnneagramType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type AgentVersionPrompt = {
  persona: string;
  /** Chaves "1" a "9". Tipo sem texto não gera bloco. */
  typeGuides: Readonly<Partial<Record<string, string>>>;
};

export type AgentExample = {
  /** null = exemplo genérico, vale para qualquer tipo. */
  enneagramType: EnneagramType | null;
  userMessage: string;
  idealReply: string;
};

export type AgentVersionStatus = "draft" | "active" | "archived";

export type AgentVersionSummary = {
  id: number;
  version: number;
  status: AgentVersionStatus;
  label: string | null;
  model: string;
  createdAt: string;
  createdByName: string | null;
  publishedAt: string | null;
  publishedByName: string | null;
};

export type AgentVersion = AgentVersionSummary & {
  persona: string;
  typeGuides: Readonly<Partial<Record<string, string>>>;
  maxOutputTokens: number;
  knowledgeEnabled: boolean;
};

export type VersionActionResult =
  { ok: true; version: AgentVersion } | { ok: false; message: string };

export type DeleteVersionResult = { ok: true } | { ok: false; message: string };
