
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  role: string;
};

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      } catch {
        // Fallback to null if server is down or returns error, 
        // but ideally in no-login mode it should always return the default user.
        return null; 
      }
    },
    retry: false,
    staleTime: Infinity, // User is static in this mode
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };
}

export function useLogin() {
  return useMutation({
    mutationFn: async () => {
      throw new Error("Authentication is disabled in this version.");
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async () => {
      throw new Error("Authentication is disabled in this version.");
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      throw new Error("Authentication is disabled in this version.");
    },
  });
}
