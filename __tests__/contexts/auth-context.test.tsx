import { render, screen, act, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { AuthProvider, useAuth } from "@/contexts/auth-context";

function TestConsumer() {
  const { user, isLoading, isAuthenticated, signIn, signOut } = useAuth();
  return (
    <>
      <Text testID="loading">{isLoading ? "loading" : "ready"}</Text>
      <Text testID="authenticated">{isAuthenticated ? "yes" : "no"}</Text>
      <Text testID="user">{user?.email ?? "none"}</Text>
      <Text testID="sign-in" onPress={() => signIn("test@example.com")}>
        Sign In
      </Text>
      <Text testID="sign-out" onPress={() => signOut()}>
        Sign Out
      </Text>
    </>
  );
}

describe("AuthContext", () => {
  it("provides initial unauthenticated state", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    });
    expect(screen.getByTestId("authenticated")).toHaveTextContent("no");
    expect(screen.getByTestId("user")).toHaveTextContent("none");
  });

  it("updates state after signIn", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    });

    await act(async () => {
      screen.getByTestId("sign-in").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("yes");
    });
    expect(screen.getByTestId("user")).toHaveTextContent("test@example.com");
  });

  it("clears state after signOut", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    });

    // Sign in first
    await act(async () => {
      screen.getByTestId("sign-in").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("yes");
    });

    // Then sign out
    await act(async () => {
      screen.getByTestId("sign-out").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("no");
    });
    expect(screen.getByTestId("user")).toHaveTextContent("none");
  });

  it("throws when useAuth is used outside AuthProvider", () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    expect(() => render(<TestConsumer />)).toThrow(
      "useAuth must be used within an AuthProvider",
    );

    consoleSpy.mockRestore();
  });
});
