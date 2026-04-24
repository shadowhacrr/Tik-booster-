import { trpc } from "@/providers/trpc";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";

type UsePanelAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
  requiredRole?: string;
};

export function usePanelAuth(options?: UsePanelAuthOptions) {
  const {
    redirectOnUnauthenticated = false,
    redirectPath = "/admin",
    requiredRole,
  } = options ?? {};

  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = trpc.panelAuth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logoutMutation = trpc.panelAuth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      navigate(redirectPath);
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  const isAuthorized = useMemo(() => {
    if (!user) return false;
    if (requiredRole && user.role !== requiredRole) return false;
    return true;
  }, [user, requiredRole]);

  useEffect(() => {
    if (redirectOnUnauthenticated && !isLoading) {
      if (!user) {
        navigate(redirectPath);
      } else if (requiredRole && user.role !== requiredRole) {
        navigate(redirectPath);
      }
    }
  }, [redirectOnUnauthenticated, isLoading, user, navigate, redirectPath, requiredRole]);

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isAuthorized,
      isLoading: isLoading || logoutMutation.isPending,
      error,
      logout,
      refresh: refetch,
    }),
    [user, isAuthorized, isLoading, logoutMutation.isPending, error, logout, refetch],
  );
}
