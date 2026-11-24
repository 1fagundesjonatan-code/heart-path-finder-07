import { z } from "zod";
import { APP_ROLES } from "@/shared/roles";

export const roleChangeSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(APP_ROLES),
});
export type RoleChangeInput = z.infer<typeof roleChangeSchema>;

export const USERS_PAGE_SIZE = 25;

export const listUsersSchema = z.object({ page: z.number().int().min(1).max(10_000) });
