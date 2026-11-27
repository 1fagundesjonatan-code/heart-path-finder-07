import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AUTH_ERROR_CODES } from "@/features/auth/error-codes";
import { requireRole } from "@/features/auth/functions/require-role";
import { STAFF_ROLES } from "@/shared/roles";
import {
  CLIENTS_PAGE_SIZE,
  clientDetailInputSchema,
  clientDetailSchema,
  clientRowSchema,
  listClientsInputSchema,
  type ClientDetail,
  type ClientsPage,
} from "../schemas";

/** Pede uma linha a mais que a página para saber se há próxima, sem count. */
export const listClientsFn = createServerFn({ method: "GET" })
  .middleware([requireRole(STAFF_ROLES)])
  .inputValidator((data: unknown) => listClientsInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<ClientsPage> => {
    const { data: rows, error } = await context.supabase.rpc("admin_list_clients", {
      p_search: data.search?.trim() || undefined,
      p_after: data.after,
      p_limit: CLIENTS_PAGE_SIZE + 1,
    });
    if (error) {
      console.error("listClients: falha na RPC", { code: error.code });
      if (error.code === "42501") throw new Response(AUTH_ERROR_CODES.forbidden, { status: 403 });
      throw new Error("Não foi possível listar os clientes.", { cause: error });
    }

    const parsed = z.array(clientRowSchema).parse(rows ?? []);
    const items = parsed.slice(0, CLIENTS_PAGE_SIZE);
    const hasNext = parsed.length > CLIENTS_PAGE_SIZE;
    return { items, nextCursor: hasNext ? (items.at(-1)?.contact_id ?? null) : null };
  });

/** Devolve null quando o usuário não é cliente (inexistente, equipe ou profissional). */
export const getClientDetailFn = createServerFn({ method: "GET" })
  .middleware([requireRole(STAFF_ROLES)])
  .inputValidator((data: unknown) => clientDetailInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<ClientDetail | null> => {
    const { data: detail, error } = await context.supabase.rpc("admin_client_detail", {
      p_user_id: data.userId,
    });
    if (error) {
      if (error.code === "P0002") return null;
      console.error("getClientDetail: falha na RPC", { code: error.code });
      if (error.code === "42501") throw new Response(AUTH_ERROR_CODES.forbidden, { status: 403 });
      throw new Error("Não foi possível carregar o cliente.", { cause: error });
    }
    return clientDetailSchema.parse(detail);
  });
