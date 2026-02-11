import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Unwrap SuperJSON envelope if present
  const userData = useMemo(() => {
    if (!meQuery.data) return null;
    // Check if data is wrapped in SuperJSON format
    if (
      typeof meQuery.data === "object" &&
      "json" in meQuery.data &&
      "meta" in meQuery.data
    ) {
      return (meQuery.data as any).json;
    }
    return meQuery.data;
  }, [meQuery.data]);

  useEffect(() => {
    console.log("[useAuth] meQuery data:", meQuery.data);
    console.log("[useAuth] unwrapped userData:", userData);
  }, [meQuery.data, userData]);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        if (typeof window !== "undefined") {
          window.location.href = "/logout";
        }
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      if (typeof window !== "undefined") {
        window.location.assign(`/logout?ts=${Date.now()}`);
        return;
      }
    }
  }, [logoutMutation, utils]);

  const state = useMemo(
    () => ({
      user: userData?.openId ? userData : null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(userData?.openId),
    }),
    [
      userData,
      meQuery.error,
      meQuery.isLoading,
      logoutMutation.error,
      logoutMutation.isPending,
    ]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (userData?.openId) {
      localStorage.setItem("manus-runtime-user-info", JSON.stringify(userData));
    } else {
      localStorage.removeItem("manus-runtime-user-info");
    }
  }, [userData]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
