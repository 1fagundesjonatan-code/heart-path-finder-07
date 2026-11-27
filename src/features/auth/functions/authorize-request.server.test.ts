import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, test, vi } from "vitest";
import { authorizeWith } from "./authorize-request.server";
import type { Database } from "@/integrations/supabase/types";

type FakeOptions = {
  user?: { id: string } | null;
  authError?: boolean;
  permitted?: boolean | null;
  roleError?: boolean;
};

function fakeClient(options: FakeOptions) {
  const rpc = vi.fn().mockResolvedValue({
    data: options.permitted ?? false,
    error: options.roleError ? { code: "XX000" } : null,
  });
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: options.user ?? null },
        error: options.authError ? { message: "jwt expired" } : null,
      }),
    },
    rpc,
  } as unknown as SupabaseClient<Database>;
  return { client, rpc };
}

describe("authorizeWith", () => {
  test("sem sessão devolve 401 com código estável", async () => {
    const { client, rpc } = fakeClient({ user: null });
    const result = await authorizeWith(client, ["admin"]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
    expect(await result.response.text()).toBe("UNAUTHENTICATED");
    expect(rpc).not.toHaveBeenCalled();
  });

  test("erro do auth também é 401", async () => {
    const { client } = fakeClient({ user: { id: "u1" }, authError: true });
    const result = await authorizeWith(client, ["admin"]);
    expect(!result.ok && result.response.status).toBe(401);
  });

  test("sessão sem papel permitido devolve 403", async () => {
    const { client, rpc } = fakeClient({ user: { id: "u1" }, permitted: false });
    const result = await authorizeWith(client, ["admin", "collaborator"]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(403);
    expect(await result.response.text()).toBe("FORBIDDEN");
    expect(rpc).toHaveBeenCalledWith("has_any_role", { p_roles: ["admin", "collaborator"] });
  });

  test("falha ao verificar papel devolve 500, nunca libera", async () => {
    const { client } = fakeClient({ user: { id: "u1" }, roleError: true });
    const result = await authorizeWith(client, ["admin"]);
    expect(!result.ok && result.response.status).toBe(500);
  });

  test("papel permitido devolve contexto com cliente e userId", async () => {
    const { client } = fakeClient({ user: { id: "u1" }, permitted: true });
    const result = await authorizeWith(client, ["admin"]);
    expect(result).toEqual({ ok: true, supabase: client, userId: "u1" });
  });
});
