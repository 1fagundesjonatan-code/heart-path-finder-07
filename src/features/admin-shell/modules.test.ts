import { describe, expect, test } from "vitest";
import { MODULE_STATUSES } from "@/shared/module-status";
import {
  ADMIN_MODULES,
  MODULE_GROUPS,
  canAccessModule,
  getModule,
  groupModules,
  modulesForRoles,
} from "./modules";

describe("registro de módulos", () => {
  test("tem os 18 módulos, ids e slugs únicos", () => {
    expect(ADMIN_MODULES).toHaveLength(18);
    expect(new Set(ADMIN_MODULES.map((m) => m.id)).size).toBe(18);
    expect(new Set(ADMIN_MODULES.map((m) => m.slug)).size).toBe(18);
  });

  test("todo status pertence ao conjunto permitido e todo módulo tem papel", () => {
    for (const m of ADMIN_MODULES) {
      expect(MODULE_STATUSES).toContain(m.status);
      expect(m.roles.length).toBeGreaterThan(0);
    }
  });

  test("admin vê tudo; colaborador vê tudo menos Configurações (papéis)", () => {
    expect(modulesForRoles(["admin"])).toHaveLength(18);
    const collaborator = modulesForRoles(["collaborator"]).map((m) => m.id);
    expect(collaborator).toHaveLength(17);
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

  test("todo módulo tem grupo válido e os grupos têm ordem e rótulo únicos", () => {
    const groupIds = MODULE_GROUPS.map((g) => g.id);
    expect(new Set(groupIds).size).toBe(groupIds.length);
    expect(new Set(MODULE_GROUPS.map((g) => g.label)).size).toBe(groupIds.length);
    for (const m of ADMIN_MODULES) expect(groupIds).toContain(m.group);
  });

  test("groupModules agrupa na ordem do menu e cobre todos os módulos", () => {
    const sections = groupModules(ADMIN_MODULES);
    expect(sections.map((s) => s.label)).toEqual([
      "Visão geral",
      "Pessoas",
      "Aquisição",
      "Agente de IA",
      "Produto",
      "Receita",
      "Sistema",
    ]);
    expect(sections.flatMap((s) => s.modules)).toHaveLength(18);
    expect(sections.find((s) => s.id === "agent")?.modules.map((m) => m.label)).toEqual([
      "Chat",
      "Treinamento do agente",
      "Mentor IA",
    ]);
  });

  test("groupModules omite grupo sem módulo acessível ao papel", () => {
    const sections = groupModules(modulesForRoles(["collaborator"]));
    expect(sections.find((s) => s.id === "system")?.modules.map((m) => m.id)).toEqual([
      "integracoes",
    ]);
    expect(groupModules([])).toEqual([]);
    expect(groupModules(modulesForRoles(["partner"]))).toEqual([]);
  });

  test("módulo chat existe em /admin/chat para a equipe", () => {
    const chat = getModule("chat");
    expect(chat.slug).toBe("chat");
    expect(chat.group).toBe("agent");
    expect(getModule("the-self-ai").label).toBe("Treinamento do agente");
  });
});
