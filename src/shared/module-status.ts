export const MODULE_STATUSES = [
  "Implementado",
  "Em desenvolvimento",
  "Planejado",
  "Necessita integração",
  "Necessita validação",
] as const;
export type ModuleStatus = (typeof MODULE_STATUSES)[number];

export const MODULE_STATUS_MEANING: Record<ModuleStatus, string> = {
  Implementado: "Funciona de ponta a ponta com dado real e testado.",
  "Em desenvolvimento": "Em construção. Só exibe o que já tem fonte real de dados.",
  Planejado: "Definido, ainda não iniciado. Sem telas nem números.",
  "Necessita integração": "Depende de um sistema externo que ainda não foi conectado.",
  "Necessita validação": "Existe, mas precisa de validação humana, jurídica ou psicométrica.",
};
