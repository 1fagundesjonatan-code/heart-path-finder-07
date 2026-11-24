import { describe, expect, test, vi } from "vitest";
import { getAuthErrorCode, handleAuthError, isAuthError, queryRetry } from "./error-codes";

describe("erros de autenticação", () => {
  test("reconhece códigos 401/403 e ignora outros erros", () => {
    expect(getAuthErrorCode(new Error("UNAUTHENTICATED"))).toBe("UNAUTHENTICATED");
    expect(getAuthErrorCode(new Error("FORBIDDEN"))).toBe("FORBIDDEN");
    expect(isAuthError(new Error("boom"))).toBe(false);
    expect(isAuthError("UNAUTHENTICATED")).toBe(false);
  });

  test("401 redireciona para /entrar com a rota atual codificada", () => {
    const handlers = { redirectToLogin: vi.fn(), notifyForbidden: vi.fn() };
    handleAuthError(new Error("UNAUTHENTICATED"), handlers, "/admin/x?a=1");
    expect(handlers.redirectToLogin).toHaveBeenCalledWith("/entrar?next=%2Fadmin%2Fx%3Fa%3D1");
    expect(handlers.notifyForbidden).not.toHaveBeenCalled();
  });

  test("403 só avisa", () => {
    const handlers = { redirectToLogin: vi.fn(), notifyForbidden: vi.fn() };
    handleAuthError(new Error("FORBIDDEN"), handlers, "/admin");
    expect(handlers.notifyForbidden).toHaveBeenCalledOnce();
    expect(handlers.redirectToLogin).not.toHaveBeenCalled();
  });

  test("não faz retry de erro de auth, mas tenta duas vezes os demais", () => {
    expect(queryRetry(0, new Error("UNAUTHENTICATED"))).toBe(false);
    expect(queryRetry(1, new Error("rede"))).toBe(true);
    expect(queryRetry(2, new Error("rede"))).toBe(false);
  });
});
