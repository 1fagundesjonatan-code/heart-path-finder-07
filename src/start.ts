import { createStart, createMiddleware } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

/** Áreas autenticadas: nunca em cache e nunca dentro de iframe de outro site (clickjacking). */
const PROTECTED_PREFIXES = ["/admin", "/entrar", "/_serverFn", "/api"] as const;

const securityHeadersMiddleware = createMiddleware().server(async ({ next, pathname }) => {
  if (
    PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  ) {
    setResponseHeader("Cache-Control", "no-store");
    setResponseHeader("X-Frame-Options", "DENY");
    setResponseHeader("Content-Security-Policy", "frame-ancestors 'none'");
  }
  return next();
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, securityHeadersMiddleware],
}));
