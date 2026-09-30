"use client";

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { useMounted } from "./use-mounted";

type Options<T> = Omit<UseQueryOptions<T, Error, T, readonly unknown[]>, "queryKey" | "queryFn" | "enabled">;

/**
 * Every data hook goes through here so the first paint is always a skeleton
 * (no SSR/CSR mismatch) and the query layer stays swappable.
 */
export function useApiQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options?: Options<T> & { enabled?: boolean },
) {
  const mounted = useMounted();
  const query = useQuery<T, Error, T, readonly unknown[]>({
    queryKey,
    queryFn,
    enabled: mounted && options?.enabled !== false,
    ...options,
  });
  return { ...query, isLoading: query.isPending || (!mounted && !query.data) };
}

export function useApiMutation<TVars, TData>(
  mutationFn: (vars: TVars) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, vars: TVars) => void | Promise<void>;
    onError?: (error: Error, vars: TVars) => void;
    invalidates?: readonly (readonly unknown[])[];
  },
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (data, vars) => {
      await Promise.all((options?.invalidates ?? []).map((key) => queryClient.invalidateQueries({ queryKey: key })));
      await options?.onSuccess?.(data, vars);
    },
    onError: (error, _vars) => options?.onError?.(error as Error, _vars),
  });
}

export const queryKeys = {
  workers: ["workers"] as const,
  worker: (id: string) => ["worker", id] as const,
  categories: ["categories"] as const,
  services: ["services"] as const,
  bookings: ["bookings"] as const,
  booking: (id: string) => ["booking", id] as const,
  transactions: ["transactions"] as const,
  reviews: ["reviews"] as const,
  complaints: ["complaints"] as const,
  notifications: (userId: string) => ["notifications", userId] as const,
  conversations: (userId: string) => ["conversations", userId] as const,
  conversation: (userId: string, id: string) => ["conversation", userId, id] as const,
  users: ["users"] as const,
  admin: ["admin"] as const,
};
