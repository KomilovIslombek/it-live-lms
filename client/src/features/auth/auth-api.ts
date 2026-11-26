import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

export type Role = "admin" | "mentor" | "assistant" | "student";

export interface CurrentUser {
  id: number;
  phone: string;
  full_name: string;
  status: boolean;
  role: Role;
}

export const meQueryKey = ["auth", "me"] as const;

async function fetchMe() {
  try {
    const { user } = await api<{ user: CurrentUser }>("/auth/me");
    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { phone: string; password: string }) =>
      api<{ user: CurrentUser }>("/auth/login", {
        method: "POST",
        body: input,
      }),
    onSuccess: ({ user }) => {
      queryClient.clear();
      queryClient.setQueryData(meQueryKey, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(meQueryKey, null);
    },
  });
}

export const homePathByRole: Record<Role, string> = {
  admin: "/admin",
  mentor: "/mentor",
  student: "/student",
  assistant: "/no-panel",
};
