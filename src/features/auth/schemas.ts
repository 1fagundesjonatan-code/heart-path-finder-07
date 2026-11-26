import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(254),
  password: z.string().min(1, "Informe a senha.").max(256),
});
export type LoginInput = z.infer<typeof loginSchema>;

function hasControlOrBackslash(value: string): boolean {
  return [...value].some((char) => {
    const code = char.charCodeAt(0);
    return code <= 0x1f || code === 0x7f || char === "\\";
  });
}
const PROBE_ORIGIN = "http://x";

/**
 * Aceita apenas caminhos internos. O parser WHATWG remove TAB/LF/CR e trata "\\" como "/", então
 * "/\t/evil.com" viraria "//evil.com": rejeitamos controles e barra invertida e, por garantia,
 * conferimos que resolver contra uma origem fictícia não muda a origem.
 */
export function sanitizeNextPath(next: unknown, fallback = "/admin"): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) return fallback;
  if (hasControlOrBackslash(next)) return fallback;
  try {
    const url = new URL(next, PROBE_ORIGIN);
    if (url.origin !== PROBE_ORIGIN) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
