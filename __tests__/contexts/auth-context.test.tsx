import { render, screen, act, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { AuthProvider, useAuth } from "@/contexts/auth-context";

function TestConsumer() {
  const {
    user,
    isLoading,
    isAuthenticated,
    hasCompletedOnboarding,
    signIn,
    signOut,
    completeOnboarding,
    deletionScheduledAt,
    requestAccountDeletion,
    cancelAccountDeletion,
  } = useAuth();
  return (
    <>
      <Text testID="loading">{isLoading ? "loading" : "ready"}</Text>
      <Text testID="authenticated">{isAuthenticated ? "yes" : "no"}</Text>
      <Text testID="onboarded">{hasCompletedOnboarding ? "yes" : "no"}</Text>
      <Text testID="user">{user?.email ?? "none"}</Text>
      <Text testID="deletion-scheduled">
        {deletionScheduledAt ?? "not-scheduled"}
      </Text>
      <Text testID="sign-in" onPress={() => signIn("test@example.com")}>
        Sign In
      </Text>
      <Text testID="sign-out" onPress={() => signOut()}>
        Sign Out
      </Text>
      <Text testID="complete-onboarding" onPress={() => completeOnboarding()}>
        Complete Onboarding
      </Text>
      <Text testID="request-deletion" onPress={() => requestAccountDeletion()}>
        Request Deletion
      </Text>
      <Text testID="cancel-deletion" onPress={() => cancelAccountDeletion()}>
        Cancel Deletion
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

  it("provides hasCompletedOnboarding as false initially", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    });
    expect(screen.getByTestId("onboarded")).toHaveTextContent("no");
  });

  it("sets hasCompletedOnboarding to true after completeOnboarding", async () => {
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

    // Complete onboarding
    await act(async () => {
      screen.getByTestId("complete-onboarding").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("onboarded")).toHaveTextContent("yes");
    });
  });

  it("resets hasCompletedOnboarding on signOut", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    });

    // Sign in and complete onboarding
    await act(async () => {
      screen.getByTestId("sign-in").props.onPress();
    });
    await act(async () => {
      screen.getByTestId("complete-onboarding").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("onboarded")).toHaveTextContent("yes");
    });

    // Sign out
    await act(async () => {
      screen.getByTestId("sign-out").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("onboarded")).toHaveTextContent("no");
    });
  });

  it("provides deletionScheduledAt as null initially", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    });
    expect(screen.getByTestId("deletion-scheduled")).toHaveTextContent(
      "not-scheduled",
    );
  });

  it("sets deletionScheduledAt when requestAccountDeletion is called", async () => {
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

    // Request deletion
    await act(async () => {
      screen.getByTestId("request-deletion").props.onPress();
    });

    await waitFor(() => {
      const deletionText =
        screen.getByTestId("deletion-scheduled").props.children;
      expect(deletionText).not.toBe("not-scheduled");
      // Should be an ISO date string
      expect(new Date(deletionText).toISOString()).toBe(deletionText);
    });
  });

  it("clears deletionScheduledAt when cancelAccountDeletion is called", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    });

    // Sign in
    await act(async () => {
      screen.getByTestId("sign-in").props.onPress();
    });

    // Request deletion
    await act(async () => {
      screen.getByTestId("request-deletion").props.onPress();
    });

    await waitFor(() => {
      const deletionText =
        screen.getByTestId("deletion-scheduled").props.children;
      expect(deletionText).not.toBe("not-scheduled");
    });

    // Cancel deletion
    await act(async () => {
      screen.getByTestId("cancel-deletion").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("deletion-scheduled")).toHaveTextContent(
        "not-scheduled",
      );
    });
  });

  it("clears deletionScheduledAt on signOut", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    });

    // Sign in and request deletion
    await act(async () => {
      screen.getByTestId("sign-in").props.onPress();
    });
    await act(async () => {
      screen.getByTestId("request-deletion").props.onPress();
    });

    await waitFor(() => {
      const deletionText =
        screen.getByTestId("deletion-scheduled").props.children;
      expect(deletionText).not.toBe("not-scheduled");
    });

    // Sign out
    await act(async () => {
      screen.getByTestId("sign-out").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("deletion-scheduled")).toHaveTextContent(
        "not-scheduled",
      );
    });
  });
});
