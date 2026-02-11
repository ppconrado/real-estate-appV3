"use client";

import { useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { UNAUTHED_ERR_MSG } from "@/shared/const";
import { getLoginUrl } from "@/const";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        links: [
          httpBatchLink({
            url: "/api/trpc",
            transformer: superjson,
            fetch(input, init) {
              return globalThis
                .fetch(input, {
                  ...(init ?? {}),
                  credentials: "include",
                })
                .then(async response => {
                  const contentType =
                    response.headers.get("content-type") || "";
                  if (!response.ok || contentType.includes("text/html")) {
                    const bodyText = await response.clone().text();
                    console.error("[tRPC] Response URL:", response.url);
                    console.error("[tRPC] Response status:", response.status);
                    console.error(
                      "[tRPC] Response content-type:",
                      contentType || "(none)"
                    );
                    console.error(
                      "[tRPC] Response body preview:",
                      bodyText.slice(0, 400)
                    );
                  }
                  return response;
                });
            },
          }),
        ],
      }),
    []
  );

  useEffect(() => {
    const redirectToLoginIfUnauthorized = (error: unknown) => {
      if (!(error instanceof TRPCClientError)) return;
      if (typeof window === "undefined") return;
      if (error.message !== UNAUTHED_ERR_MSG) return;
      window.location.href = getLoginUrl();
    };

    const querySub = queryClient.getQueryCache().subscribe(event => {
      if (event.type === "updated" && event.action.type === "error") {
        redirectToLoginIfUnauthorized(event.query.state.error);
        console.error("[API Query Error]", event.query.state.error);
      }
    });

    const mutationSub = queryClient.getMutationCache().subscribe(event => {
      if (event.type === "updated" && event.action.type === "error") {
        redirectToLoginIfUnauthorized(event.mutation.state.error);
        console.error("[API Mutation Error]", event.mutation.state.error);
      }
    });

    return () => {
      querySub();
      mutationSub();
    };
  }, [queryClient]);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          </trpc.Provider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
