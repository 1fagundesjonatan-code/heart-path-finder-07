import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { handleAuthError, queryRetry } from "@/features/auth/error-codes";
import { routeTree } from "./routeTree.gen";

function onGlobalError(error: unknown) {
  if (typeof window === "undefined") return;
  handleAuthError(
    error,
    {
      redirectToLogin: (href) => window.location.assign(href),
      notifyForbidden: (message) => toast.error(message),
    },
    `${window.location.pathname}${window.location.search}`,
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError: onGlobalError }),
    mutationCache: new MutationCache({ onError: onGlobalError }),
    defaultOptions: { queries: { retry: queryRetry } },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
