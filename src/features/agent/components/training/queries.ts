export const VERSIONS_KEY = ["admin", "agent-versions"] as const;
export const versionKey = (id: number) => ["admin", "agent-version", id] as const;
