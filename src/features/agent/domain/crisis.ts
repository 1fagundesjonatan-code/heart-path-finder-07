const BENIGN_IDIOM_SUFFIX = String.raw`(?! de (rir|vergonha|fome|sono|saudade|medo|calor|frio|raiva|curiosidade)\b)`;

// Piso conservador, não classificador: prefere falso positivo a falso negativo em frases explícitas.
const CRISIS_PATTERNS: readonly RegExp[] = [
  /\bme matar\b/,
  new RegExp(
    String.raw`\b(quero|queria|vou|vontade de|penso em|pensando em) morrer\b${BENIGN_IDIOM_SUFFIX}`,
  ),
  /\bmelhor eu morrer\b/,
  /\bnao (quero|aguento|consigo) mais viver\b/,
  /\bnao (vejo sentido|vale a pena) (em )?viver\b/,
  /\bacabar com tudo\b/,
  /\b(tirar|acabar com|dar fim a|por fim a) (a )?(minha|propria) (propria )?vida\b/,
  /\bme (machucar|ferir|cortar com)\b/,
  /\bautomutilacao\b/,
  /\bsuicid/,
];

function normalize(text: string): string {
  return ` ${text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
}

export function detectCrisisSignals(text: string): boolean {
  const normalized = normalize(text);
  return CRISIS_PATTERNS.some((pattern) => pattern.test(normalized));
}

export const CRISIS_RESPONSE =
  "Sinto muito que você esteja passando por isso, e quero que saiba que não precisa enfrentar sozinho(a). " +
  "Procure agora alguém de confiança ou um serviço de apoio: o CVV atende 24 horas pelo 188 (ligação gratuita) ou em cvv.org.br. " +
  "Se houver risco imediato, ligue para o SAMU no 192 ou vá ao pronto-atendimento mais próximo.";
