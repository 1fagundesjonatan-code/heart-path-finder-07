import { describe, expect, test } from "vitest";
import { MODULE_STATUSES } from "@/shared/module-status";
import { ADMIN_MODULES, canAccessModule, getModule, modulesForRoles } from "./modules";

describe("registro de módulos", () => {
  test("tem os 17 módulos, ids e slugs únicos", () => {
    expect(ADMIN_MODULES).toHaveLength(17);
    expect(new Set(ADMIN_MODULES.map((m) => m.id)).size).toBe(17);
    expect(new Set(ADMIN_MODULES.map((m) => m.slug)).size).toBe(17);
  });

  test("todo status pertence ao conjunto permitido e todo módulo tem papel", () => {
    for (const m of ADMIN_MODULES) {
      expect(MODULE_STATUSES).toContain(m.status);
      expect(m.roles.length).toBeGreaterThan(0);
    }
  });

  test("admin vê tudo; financeiro não vê CRM nem Configurações", () => {
    expect(modulesForRoles(["admin"])).toHaveLength(17);
    const finance = modulesForRoles(["finance"]).map((m) => m.id);
    expect(finance).toContain("financeiro");
    expect(finance).not.toContain("crm");
    expect(finance).not.toContain("configuracoes");
  });

  test("cliente sem papel de staff não acessa nada", () => {
    expect(modulesForRoles(["client"])).toHaveLength(0);
    expect(canAccessModule(["client"], getModule("dashboard"))).toBe(false);
  });
});
