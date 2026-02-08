import { QueryClient, type Query } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes (data considered fresh)
      staleTime: 5 * 60 * 1000,
      // Cache time: 24 hours (for offline persistence)
      gcTime: 24 * 60 * 60 * 1000,
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

// Create AsyncStorage persister for offline caching
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "littlejourney-query-cache",
  // Throttle writes to avoid performance issues
  throttleTime: 1000,
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        // Cache persists for 24 hours
        maxAge: 24 * 60 * 60 * 1000,
        // Dehydrate options - only persist successful queries
        dehydrateOptions: {
          shouldDehydrateQuery: (query: Query) =>
            query.state.status === "success",
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
