import React from "react";
import { renderHook, waitFor } from "@testing-library/react-native";
import { useQuery } from "@tanstack/react-query";
import { QueryProvider, queryClient } from "@/providers/query-provider";

describe("QueryProvider", () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it("provides QueryClient to children", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryProvider>{children}</QueryProvider>
    );

    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ["test"],
          queryFn: () => Promise.resolve("test-data"),
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe("test-data");
  });

  it("exports queryClient for manual operations", () => {
    expect(queryClient).toBeDefined();
    expect(typeof queryClient.invalidateQueries).toBe("function");
    expect(typeof queryClient.setQueryData).toBe("function");
  });

  it("handles query errors gracefully", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryProvider>{children}</QueryProvider>
    );

    const error = new Error("test error");
    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ["error-test"],
          queryFn: () => Promise.reject(error),
          retry: false,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
  });

  it("caches queries properly", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryProvider>{children}</QueryProvider>
    );

    let callCount = 0;
    const queryFn = () => {
      callCount++;
      return Promise.resolve(`data-${callCount}`);
    };

    const { result: result1 } = renderHook(
      () =>
        useQuery({
          queryKey: ["cache-test"],
          queryFn,
          staleTime: 60000,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result1.current.isSuccess).toBe(true));
    expect(result1.current.data).toBe("data-1");

    // Second hook should get cached data
    const { result: result2 } = renderHook(
      () =>
        useQuery({
          queryKey: ["cache-test"],
          queryFn,
          staleTime: 60000,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result2.current.isSuccess).toBe(true));
    expect(result2.current.data).toBe("data-1");
    expect(callCount).toBe(1); // Only called once due to cache
  });
});
