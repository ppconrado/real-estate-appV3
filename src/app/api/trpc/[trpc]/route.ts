import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/trpc/router";
import { createTrpcContext } from "@/server/trpc/context";

export const runtime = "nodejs";

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTrpcContext(req),
    onError({ error, path, type }) {
      console.error("[tRPC]", { path, type, error });
    },
    responseMeta({ ctx }) {
      if (!ctx?.setCookieHeaders?.length) return {};
      const headers = new Headers();
      ctx.setCookieHeaders.forEach(value =>
        headers.append("set-cookie", value)
      );
      return { headers };
    },
  });
}

export { handler as GET, handler as POST, handler as OPTIONS };
