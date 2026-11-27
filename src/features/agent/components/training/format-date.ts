const DATE_FORMAT = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function formatVersionDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}
