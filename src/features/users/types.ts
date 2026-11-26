import type { AppRole } from "@/shared/roles";

export type ManagedUser = {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  roles: AppRole[];
};

export type UserList = { users: ManagedUser[]; page: number; hasNext: boolean };

export type RoleChangeResult = { ok: true } | { ok: false; message: string };
