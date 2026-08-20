import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export function useUsers() {
  return useQuery({ queryKey: ["users"], queryFn: apiClient.users });
}

export function useUsersByRole(role: string) {
  const { data, ...rest } = useUsers();
  return { data: data?.filter((u) => u.role === role), ...rest };
}