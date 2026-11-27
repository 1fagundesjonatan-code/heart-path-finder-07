import { describe, expect, it } from "vitest";
import { clientDisplayName, enneagramLabel, eventLabel } from "./domain/labels";
import { clientDetailSchema, clientRowSchema, listClientsInputSchema } from "./schemas";

const USER_ID = "7f1c2f0e-3b2a-4d57-9f0a-1a2b3c4d5e6f";

describe("listClientsInputSchema", () => {
  it("aceita vazio e rejeita cursor inválido e busca longa", () => {
    expect(listClientsInputSchema.safeParse({}).success).toBe(true);
    expect(listClientsInputSchema.safeParse({ after: 0 }).success).toBe(false);
    expect(listClientsInputSchema.safeParse({ after: 1.5 }).success).toBe(false);
    expect(listClientsInputSchema.safeParse({ search: "a".repeat(101) }).success).toBe(false);
  });
});

describe("clientRowSchema", () => {
  const row = {
    contact_id: 1,
    user_id: USER_ID,
    full_name: null,
    email: "a@b.co",
    phone: null,
    stage: "lead_captured",
    created_at: "2026-11-01T10:00:00Z",
    primary_type: null,
    assessment_completed_at: null,
  };

  it("aceita linha válida e rejeita estágio desconhecido", () => {
    expect(clientRowSchema.safeParse(row).success).toBe(true);
    expect(clientRowSchema.safeParse({ ...row, stage: "foo" }).success).toBe(false);
  });
});

describe("clientDetailSchema", () => {
  it("aceita ficha sem consentimento do Eneagrama e sem IA", () => {
    const parsed = clientDetailSchema.safeParse({
      contact: {
        id: 1,
        user_id: USER_ID,
        full_name: "Ana",
        email: "a@b.co",
        phone: null,
        stage: "active_customer",
        notes: null,
        created_at: "2026-11-01T10:00:00Z",
        last_interaction_at: null,
      },
      enneagram_shared: false,
      enneagram: null,
      consents: [],
      activity: [],
      ai: null,
    });
    expect(parsed.success).toBe(true);
  });
});

describe("labels", () => {
  it("usa nome, depois e-mail, depois fallback", () => {
    expect(clientDisplayName({ full_name: " Ana ", email: "a@b.co" })).toBe("Ana");
    expect(clientDisplayName({ full_name: "  ", email: "a@b.co" })).toBe("a@b.co");
    expect(clientDisplayName({ full_name: null, email: null })).toBe("Sem nome");
  });

  it("mostra 'Não compartilhado' sem tipo", () => {
    expect(enneagramLabel({ primary_type: null })).toBe("Não compartilhado");
    expect(enneagramLabel({ primary_type: "4" })).toBe("Tipo 4");
  });

  it("mantém o nome cru de evento desconhecido", () => {
    expect(eventLabel("test_completed")).toBe("Concluiu o teste");
    expect(eventLabel("novo_evento")).toBe("novo_evento");
  });
});
