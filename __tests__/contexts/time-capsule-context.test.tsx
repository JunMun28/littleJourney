import { render, screen, act, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import {
  TimeCapsuleProvider,
  useTimeCapsules,
  type TimeCapsule,
  type CapsuleStatus,
} from "@/contexts/time-capsule-context";

function TestConsumer() {
  const {
    capsules,
    createCapsule,
    getCapsule,
    getSealedCapsules,
    getUnlockedCapsules,
  } = useTimeCapsules();

  const sealed = getSealedCapsules();
  const unlocked = getUnlockedCapsules();

  return (
    <>
      <Text testID="count">{capsules.length}</Text>
      <Text testID="sealed-count">{sealed.length}</Text>
      <Text testID="unlocked-count">{unlocked.length}</Text>
      <Text testID="first-content">{capsules[0]?.letterContent ?? "none"}</Text>
      <Text testID="first-status">{capsules[0]?.status ?? "none"}</Text>
      <Text testID="first-photo-count">
        {capsules[0]?.attachedPhotoUris?.length ?? 0}
      </Text>
      <Text testID="first-unlock-type">
        {capsules[0]?.unlockType ?? "none"}
      </Text>
      <Text
        testID="create-basic-letter"
        onPress={() =>
          createCapsule({
            letterContent: "Dear future you, I love you!",
            unlockType: "age",
            unlockAge: 18,
          })
        }
      >
        Create Basic
      </Text>
      <Text
        testID="create-with-photos"
        onPress={() =>
          createCapsule({
            letterContent: "Your first steps were magical",
            attachedPhotoUris: ["file:///photo1.jpg", "file:///photo2.jpg"],
            unlockType: "age",
            unlockAge: 21,
          })
        }
      >
        Create With Photos
      </Text>
      <Text
        testID="create-custom-date"
        onPress={() =>
          createCapsule({
            letterContent: "Open this on your graduation day",
            unlockType: "custom_date",
            unlockDate: "2040-06-15",
          })
        }
      >
        Create Custom Date
      </Text>
      <Text
        testID="create-preset-5"
        onPress={() =>
          createCapsule({
            letterContent: "For when you turn 5",
            unlockType: "age",
            unlockAge: 5,
          })
        }
      >
        Create Age 5
      </Text>
    </>
  );
}

describe("TimeCapsuleContext", () => {
  it("provides empty capsules initially", () => {
    render(
      <TimeCapsuleProvider>
        <TestConsumer />
      </TimeCapsuleProvider>,
    );

    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("sealed-count")).toHaveTextContent("0");
    expect(screen.getByTestId("unlocked-count")).toHaveTextContent("0");
  });

  it("creates a basic letter time capsule", async () => {
    render(
      <TimeCapsuleProvider>
        <TestConsumer />
      </TimeCapsuleProvider>,
    );

    await act(async () => {
      screen.getByTestId("create-basic-letter").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });
    expect(screen.getByTestId("first-content")).toHaveTextContent(
      "Dear future you, I love you!",
    );
    expect(screen.getByTestId("first-status")).toHaveTextContent("sealed");
    expect(screen.getByTestId("first-unlock-type")).toHaveTextContent("age");
    expect(screen.getByTestId("sealed-count")).toHaveTextContent("1");
  });

  it("creates a time capsule with attached photos", async () => {
    render(
      <TimeCapsuleProvider>
        <TestConsumer />
      </TimeCapsuleProvider>,
    );

    await act(async () => {
      screen.getByTestId("create-with-photos").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("first-photo-count")).toHaveTextContent("2");
    });
    expect(screen.getByTestId("first-content")).toHaveTextContent(
      "Your first steps were magical",
    );
  });

  it("creates a time capsule with custom unlock date", async () => {
    render(
      <TimeCapsuleProvider>
        <TestConsumer />
      </TimeCapsuleProvider>,
    );

    await act(async () => {
      screen.getByTestId("create-custom-date").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("first-unlock-type")).toHaveTextContent(
        "custom_date",
      );
    });
    expect(screen.getByTestId("first-status")).toHaveTextContent("sealed");
  });

  it("creates capsule with preset unlock age", async () => {
    render(
      <TimeCapsuleProvider>
        <TestConsumer />
      </TimeCapsuleProvider>,
    );

    await act(async () => {
      screen.getByTestId("create-preset-5").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });
    expect(screen.getByTestId("first-unlock-type")).toHaveTextContent("age");
  });

  it("newly created capsules are sealed by default", async () => {
    render(
      <TimeCapsuleProvider>
        <TestConsumer />
      </TimeCapsuleProvider>,
    );

    await act(async () => {
      screen.getByTestId("create-basic-letter").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("first-status")).toHaveTextContent("sealed");
    });
    expect(screen.getByTestId("sealed-count")).toHaveTextContent("1");
    expect(screen.getByTestId("unlocked-count")).toHaveTextContent("0");
  });

  it("throws when useTimeCapsules is used outside TimeCapsuleProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    expect(() => render(<TestConsumer />)).toThrow(
      "useTimeCapsules must be used within a TimeCapsuleProvider",
    );

    consoleSpy.mockRestore();
  });
});
