import type { AppRole } from "@/shared/roles";

export type AuthUser = { id: string; email: string | null };

export type AuthContext =
  | { status: "unconfigured" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: AuthUser; roles: AppRole[] };
