import { render, screen, act, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import {
  UserPreferencesProvider,
  useUserPreferences,
} from "@/contexts/user-preferences-context";

function TestConsumer() {
  const { dailyPromptTime, setDailyPromptTime } = useUserPreferences();
  return (
    <>
      <Text testID="prompt-time">{dailyPromptTime ?? "none"}</Text>
      <Text
        testID="set-prompt-time"
        onPress={() => setDailyPromptTime("20:00")}
      >
        Set Prompt Time
      </Text>
      <Text
        testID="set-custom-time"
        onPress={() => setDailyPromptTime("09:30")}
      >
        Set Custom Time
      </Text>
      <Text testID="clear-prompt-time" onPress={() => setDailyPromptTime(null)}>
        Clear Prompt Time
      </Text>
    </>
  );
}

describe("UserPreferencesContext", () => {
  it("provides null dailyPromptTime initially", () => {
    render(
      <UserPreferencesProvider>
        <TestConsumer />
      </UserPreferencesProvider>,
    );

    expect(screen.getByTestId("prompt-time")).toHaveTextContent("none");
  });

  it("sets daily prompt time", async () => {
    render(
      <UserPreferencesProvider>
        <TestConsumer />
      </UserPreferencesProvider>,
    );

    await act(async () => {
      screen.getByTestId("set-prompt-time").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("prompt-time")).toHaveTextContent("20:00");
    });
  });

  it("updates to a different time", async () => {
    render(
      <UserPreferencesProvider>
        <TestConsumer />
      </UserPreferencesProvider>,
    );

    // Set initial time
    await act(async () => {
      screen.getByTestId("set-prompt-time").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("prompt-time")).toHaveTextContent("20:00");
    });

    // Update to custom time
    await act(async () => {
      screen.getByTestId("set-custom-time").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("prompt-time")).toHaveTextContent("09:30");
    });
  });

  it("clears prompt time when set to null", async () => {
    render(
      <UserPreferencesProvider>
        <TestConsumer />
      </UserPreferencesProvider>,
    );

    // Set time first
    await act(async () => {
      screen.getByTestId("set-prompt-time").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("prompt-time")).toHaveTextContent("20:00");
    });

    // Clear time
    await act(async () => {
      screen.getByTestId("clear-prompt-time").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("prompt-time")).toHaveTextContent("none");
    });
  });

  it("throws when useUserPreferences is used outside UserPreferencesProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    expect(() => render(<TestConsumer />)).toThrow(
      "useUserPreferences must be used within a UserPreferencesProvider",
    );

    consoleSpy.mockRestore();
  });
});
