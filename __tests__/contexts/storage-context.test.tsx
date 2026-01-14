import { render, screen, act, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import {
  StorageProvider,
  useStorage,
  TIER_LIMITS,
  type SubscriptionTier,
} from "@/contexts/storage-context";

function TestConsumer() {
  const {
    usedBytes,
    limitBytes,
    usagePercent,
    tier,
    canUpload,
    addUsage,
    removeUsage,
    setTier,
  } = useStorage();
  return (
    <>
      <Text testID="used-bytes">{usedBytes}</Text>
      <Text testID="limit-bytes">{limitBytes}</Text>
      <Text testID="usage-percent">{usagePercent}</Text>
      <Text testID="tier">{tier}</Text>
      <Text testID="can-upload-1mb">{canUpload(1_000_000) ? "yes" : "no"}</Text>
      <Text testID="add-1mb" onPress={() => addUsage(1_000_000)}>
        Add 1MB
      </Text>
      <Text testID="add-100mb" onPress={() => addUsage(100_000_000)}>
        Add 100MB
      </Text>
      <Text testID="fill-storage" onPress={() => addUsage(TIER_LIMITS.free)}>
        Fill Storage
      </Text>
      <Text testID="remove-1mb" onPress={() => removeUsage(1_000_000)}>
        Remove 1MB
      </Text>
      <Text testID="set-standard" onPress={() => setTier("standard")}>
        Set Standard
      </Text>
      <Text testID="set-premium" onPress={() => setTier("premium")}>
        Set Premium
      </Text>
    </>
  );
}

describe("StorageContext", () => {
  it("provides default values for free tier", () => {
    render(
      <StorageProvider>
        <TestConsumer />
      </StorageProvider>,
    );

    expect(screen.getByTestId("used-bytes")).toHaveTextContent("0");
    expect(screen.getByTestId("limit-bytes")).toHaveTextContent(
      String(TIER_LIMITS.free),
    );
    expect(screen.getByTestId("usage-percent")).toHaveTextContent("0");
    expect(screen.getByTestId("tier")).toHaveTextContent("free");
  });

  it("tracks storage usage when adding", async () => {
    render(
      <StorageProvider>
        <TestConsumer />
      </StorageProvider>,
    );

    await act(async () => {
      screen.getByTestId("add-1mb").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("used-bytes")).toHaveTextContent("1000000");
    });
  });

  it("calculates usage percentage correctly", async () => {
    render(
      <StorageProvider>
        <TestConsumer />
      </StorageProvider>,
    );

    // Free tier is 500MB (524_288_000 bytes), add 100MB
    await act(async () => {
      screen.getByTestId("add-100mb").props.onPress();
    });

    await waitFor(() => {
      // 100MB / 500MB = 20%
      const percent = Math.round((100_000_000 / TIER_LIMITS.free) * 100);
      expect(screen.getByTestId("usage-percent")).toHaveTextContent(
        String(percent),
      );
    });
  });

  it("removes usage when deleting entries", async () => {
    render(
      <StorageProvider>
        <TestConsumer />
      </StorageProvider>,
    );

    // Add then remove
    await act(async () => {
      screen.getByTestId("add-1mb").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("used-bytes")).toHaveTextContent("1000000");
    });

    await act(async () => {
      screen.getByTestId("remove-1mb").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("used-bytes")).toHaveTextContent("0");
    });
  });

  it("checks if upload is allowed based on remaining space", async () => {
    render(
      <StorageProvider>
        <TestConsumer />
      </StorageProvider>,
    );

    // Initially can upload 1MB
    expect(screen.getByTestId("can-upload-1mb")).toHaveTextContent("yes");

    // Fill storage to the limit
    await act(async () => {
      screen.getByTestId("fill-storage").props.onPress();
    });

    await waitFor(() => {
      // Now at limit, can't add more
      expect(screen.getByTestId("can-upload-1mb")).toHaveTextContent("no");
    });
  });

  it("updates limits when tier changes", async () => {
    render(
      <StorageProvider>
        <TestConsumer />
      </StorageProvider>,
    );

    expect(screen.getByTestId("limit-bytes")).toHaveTextContent(
      String(TIER_LIMITS.free),
    );

    await act(async () => {
      screen.getByTestId("set-standard").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("tier")).toHaveTextContent("standard");
      expect(screen.getByTestId("limit-bytes")).toHaveTextContent(
        String(TIER_LIMITS.standard),
      );
    });

    await act(async () => {
      screen.getByTestId("set-premium").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("tier")).toHaveTextContent("premium");
      expect(screen.getByTestId("limit-bytes")).toHaveTextContent(
        String(TIER_LIMITS.premium),
      );
    });
  });

  it("throws when useStorage is used outside StorageProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    expect(() => render(<TestConsumer />)).toThrow(
      "useStorage must be used within a StorageProvider",
    );

    consoleSpy.mockRestore();
  });
});
