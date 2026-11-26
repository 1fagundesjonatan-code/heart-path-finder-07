/**
 * O cliente de server function só recebe o corpo (texto) de respostas 4xx, não o status.
 * Por isso 401 e 403 viajam com um código estável no corpo.
 */
export const AUTH_ERROR_CODES = {
  unauthenticated: "UNAUTHENTICATED",
  forbidden: "FORBIDDEN",
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

export function getAuthErrorCode(error: unknown): AuthErrorCode | null {
  if (!(error instanceof Error)) return null;
  const known = Object.values(AUTH_ERROR_CODES) as string[];
  return known.includes(error.message) ? (error.message as AuthErrorCode) : null;
}

export function isAuthError(error: unknown): boolean {
  return getAuthErrorCode(error) !== null;
}

export const FORBIDDEN_MESSAGE = "Você não tem permissão para esta ação.";

type AuthErrorHandlers = {
  redirectToLogin: (next: string) => void;
  notifyForbidden: (message: string) => void;
};

/** Sessão expirada vai para /entrar?next=<rota atual>; sem permissão avisa o usuário. */
export function handleAuthError(error: unknown, handlers: AuthErrorHandlers, currentPath: string) {
  const code = getAuthErrorCode(error);
  if (code === AUTH_ERROR_CODES.unauthenticated) {
    handlers.redirectToLogin(`/entrar?next=${encodeURIComponent(currentPath)}`);
  } else if (code === AUTH_ERROR_CODES.forbidden) {
    handlers.notifyForbidden(FORBIDDEN_MESSAGE);
  }
}

/** Não repetir consulta que falhou por sessão/permissão. */
export const queryRetry = (failureCount: number, error: unknown) =>
  !isAuthError(error) && failureCount < 2;
