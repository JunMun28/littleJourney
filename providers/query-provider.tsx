import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes (data considered fresh)
      staleTime: 5 * 60 * 1000,
      // Cache time: 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed queries once
      retry: 1,
      // Don't refetch on window focus for mobile
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
