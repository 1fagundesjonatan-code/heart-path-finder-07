/**
 * Períodos do dashboard no fuso de negócio America/Sao_Paulo.
 * O Brasil não tem horário de verão desde 2019, então o offset fixo -03:00 é exato hoje.
 * Se o horário de verão voltar, trocar por cálculo de offset via Intl antes de usar.
 * Intervalo semiaberto [from, to), igual às funções SQL.
 */
export const BUSINESS_TIME_ZONE = "America/Sao_Paulo";
const OFFSET = "-03:00";
const DAY_MS = 86_400_000;

export const PERIOD_PRESETS = ["today", "7d", "30d", "90d", "12m", "custom"] as const;
export type PeriodPreset = (typeof PERIOD_PRESETS)[number];

export const PRESET_LABELS: Record<PeriodPreset, string> = {
  today: "Hoje",
  "7d": "7 dias",
  "30d": "30 dias",
  "90d": "90 dias",
  "12m": "12 meses",
  custom: "Personalizado",
};

export type CustomRange = { from: string; to: string };
export type ResolvedPeriod = {
  preset: PeriodPreset;
  /** ISO com offset, inclusivo. */
  from: string;
  /** ISO com offset, exclusivo. */
  to: string;
  /** Primeiro e último dia (inclusivos) em YYYY-MM-DD, para exibição. */
  firstDay: string;
  lastDay: string;
};

const YMD = /^\d{4}-\d{2}-\d{2}$/;

function ymdToUtcMs(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function utcMsToYmd(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(ymd: string, days: number): string {
  return utcMsToYmd(ymdToUtcMs(ymd) + days * DAY_MS);
}

export function toBusinessYmd(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function startOfDayIso(ymd: string): string {
  return `${ymd}T00:00:00${OFFSET}`;
}

function firstDayOfMonthsAgo(ymd: string, monthsAgo: number): string {
  const [y, m] = ymd.split("-").map(Number);
  const index = y * 12 + (m - 1) - monthsAgo;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

export function isValidYmd(value: string): boolean {
  return YMD.test(value) && utcMsToYmd(ymdToUtcMs(value)) === value;
}

export const MAX_PERIOD_DAYS = 800;

/** Dias cobertos por um intervalo personalizado (ambos os extremos inclusivos). */
export function customSpanDays(range: CustomRange): number {
  return Math.round((ymdToUtcMs(range.to) - ymdToUtcMs(range.from)) / DAY_MS) + 1;
}

/** Mensagem de erro para o usuário, ou null se o intervalo é aceitável. */
export function validateCustomRange(range: CustomRange): string | null {
  if (!isValidYmd(range.from) || !isValidYmd(range.to)) return "Datas inválidas.";
  if (range.from > range.to) return "A data final precisa ser depois da inicial.";
  if (customSpanDays(range) > MAX_PERIOD_DAYS) {
    return `Escolha no máximo ${MAX_PERIOD_DAYS} dias.`;
  }
  return null;
}

export function resolvePeriod(
  preset: PeriodPreset,
  now: Date,
  custom?: CustomRange,
): ResolvedPeriod | null {
  const today = toBusinessYmd(now);
  let firstDay: string;
  let lastDay = today;

  switch (preset) {
    case "today":
      firstDay = today;
      break;
    case "7d":
      firstDay = addDays(today, -6);
      break;
    case "30d":
      firstDay = addDays(today, -29);
      break;
    case "90d":
      firstDay = addDays(today, -89);
      break;
    case "12m":
      firstDay = firstDayOfMonthsAgo(today, 11);
      break;
    case "custom":
      if (!custom || !isValidYmd(custom.from) || !isValidYmd(custom.to)) return null;
      if (custom.from > custom.to) return null;
      if (customSpanDays(custom) > MAX_PERIOD_DAYS) return null;
      firstDay = custom.from;
      lastDay = custom.to;
      break;
  }

  return {
    preset,
    from: startOfDayIso(firstDay),
    to: startOfDayIso(addDays(lastDay, 1)),
    firstDay,
    lastDay,
  };
}

export type Bucket = "day" | "week" | "month";

/** Granularidade da série: dia até ~1 mês, semana até ~6 meses, mês acima disso. */
export function pickBucket(fromIso: string, toIso: string): Bucket {
  const days = (new Date(toIso).getTime() - new Date(fromIso).getTime()) / DAY_MS;
  if (days <= 31) return "day";
  if (days <= 186) return "week";
  return "month";
}

export function formatYmd(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}
