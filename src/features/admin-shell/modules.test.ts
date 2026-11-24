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

  test("admin vê tudo; colaborador vê tudo menos Configurações (papéis)", () => {
    expect(modulesForRoles(["admin"])).toHaveLength(17);
    const collaborator = modulesForRoles(["collaborator"]).map((m) => m.id);
    expect(collaborator).toHaveLength(16);
    expect(collaborator).toContain("integracoes");
    expect(collaborator).toContain("financeiro");
    expect(collaborator).not.toContain("configuracoes");
  });

  test("parceiro não acessa o painel", () => {
    expect(modulesForRoles(["partner"])).toHaveLength(0);
  });

  test("cliente sem papel de staff não acessa nada", () => {
    expect(modulesForRoles(["client"])).toHaveLength(0);
    expect(canAccessModule(["client"], getModule("dashboard"))).toBe(false);
  });
});
