import { render, screen, act, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import {
  GrowthTrackingProvider,
  useGrowthTracking,
  type MeasurementType,
  type PercentileStandard,
} from "@/contexts/growth-tracking-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { ChildProvider, useChild } from "@/contexts/child-context";

// Extended test consumer for Singapore standards tests
function TestConsumerWithSingapore() {
  const {
    measurements,
    preferredStandard,
    setPreferredStandard,
    addMeasurement,
    calculatePercentile,
  } = useGrowthTracking();

  // Calculate percentile for first measurement using current standard
  let sgPercentileResult = null;
  if (measurements.length > 0 && measurements[0].type === "height") {
    sgPercentileResult = calculatePercentile(measurements[0], 12, "male");
  }

  return (
    <>
      <Text testID="count">{measurements.length}</Text>
      <Text testID="preferred-standard">{preferredStandard}</Text>
      <Text testID="sg-percentile-desc">
        {sgPercentileResult?.rangeDescription ?? "none"}
      </Text>
      <Text
        testID="set-singapore"
        onPress={() => setPreferredStandard("singapore")}
      >
        Set Singapore
      </Text>
      <Text
        testID="add-sg-height"
        onPress={() =>
          addMeasurement({
            type: "height",
            value: 75.5,
            date: "2024-06-15",
            childId: "child-1",
          })
        }
      >
        Add SG Height
      </Text>
    </>
  );
}

function TestConsumer() {
  const {
    measurements,
    preferredStandard,
    setPreferredStandard,
    addMeasurement,
    getMeasurements,
    deleteMeasurement,
    calculatePercentile,
    getLatestMeasurement,
  } = useGrowthTracking();

  const child1Measurements = getMeasurements("child-1");
  const child1Heights = getMeasurements("child-1", "height");
  const latestHeight = getLatestMeasurement("child-1", "height");
  const latestWeight = getLatestMeasurement("child-1", "weight");

  // Calculate percentile for first measurement if exists
  let percentileResult = null;
  if (measurements.length > 0 && measurements[0].type === "height") {
    percentileResult = calculatePercentile(measurements[0], 12, "male");
  }

  return (
    <>
      <Text testID="count">{measurements.length}</Text>
      <Text testID="child1-count">{child1Measurements.length}</Text>
      <Text testID="child1-height-count">{child1Heights.length}</Text>
      <Text testID="preferred-standard">{preferredStandard}</Text>
      <Text testID="first-type">{measurements[0]?.type ?? "none"}</Text>
      <Text testID="first-value">{measurements[0]?.value ?? 0}</Text>
      <Text testID="first-childId">{measurements[0]?.childId ?? "none"}</Text>
      <Text testID="latest-height">{latestHeight?.value ?? 0}</Text>
      <Text testID="latest-weight">{latestWeight?.value ?? 0}</Text>
      <Text testID="percentile">{percentileResult?.percentile ?? "none"}</Text>
      <Text testID="percentile-normal">
        {percentileResult?.isWithinNormalRange?.toString() ?? "none"}
      </Text>
      <Text testID="percentile-desc">
        {percentileResult?.rangeDescription ?? "none"}
      </Text>
      <Text
        testID="add-height"
        onPress={() =>
          addMeasurement({
            type: "height",
            value: 75.5,
            date: "2024-06-15",
            childId: "child-1",
          })
        }
      >
        Add Height
      </Text>
      <Text
        testID="add-weight"
        onPress={() =>
          addMeasurement({
            type: "weight",
            value: 9.5,
            date: "2024-06-15",
            childId: "child-1",
          })
        }
      >
        Add Weight
      </Text>
      <Text
        testID="add-head"
        onPress={() =>
          addMeasurement({
            type: "head_circumference",
            value: 46.2,
            date: "2024-06-15",
            childId: "child-1",
          })
        }
      >
        Add Head
      </Text>
      <Text
        testID="add-height-with-photo"
        onPress={() =>
          addMeasurement({
            type: "height",
            value: 78.0,
            date: "2024-07-20",
            childId: "child-1",
            photoUri: "file:///growth-photo.jpg",
          })
        }
      >
        Add Height with Photo
      </Text>
      <Text
        testID="add-child2-height"
        onPress={() =>
          addMeasurement({
            type: "height",
            value: 80.0,
            date: "2024-08-01",
            childId: "child-2",
          })
        }
      >
        Add Child 2 Height
      </Text>
      <Text
        testID="delete-first"
        onPress={() => {
          if (measurements.length > 0) {
            deleteMeasurement(measurements[0].id);
          }
        }}
      >
        Delete First
      </Text>
      <Text
        testID="set-singapore"
        onPress={() => setPreferredStandard("singapore")}
      >
        Set Singapore
      </Text>
      <Text
        testID="add-low-height"
        onPress={() =>
          addMeasurement({
            type: "height",
            value: 68.0, // Below 3rd percentile for 12mo boy
            date: "2024-06-15",
            childId: "child-1",
          })
        }
      >
        Add Low Height
      </Text>
      <Text
        testID="add-high-height"
        onPress={() =>
          addMeasurement({
            type: "height",
            value: 82.0, // Above 97th percentile for 12mo boy
            date: "2024-06-15",
            childId: "child-1",
          })
        }
      >
        Add High Height
      </Text>
    </>
  );
}

// Mock expo-notifications
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "undetermined" }),
  ),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" }),
  ),
  getExpoPushTokenAsync: jest.fn(() =>
    Promise.resolve({ data: "ExponentPushToken[mock-token]" }),
  ),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve("notification-id")),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  SchedulableTriggerInputTypes: {
    DAILY: "daily",
    TIME_INTERVAL: "timeInterval",
  },
}));

// Mock expo-device
jest.mock("expo-device", () => ({
  isDevice: true,
}));

describe("GrowthTrackingContext", () => {
  // Wrapper for tests that need NotificationProvider
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>
      <GrowthTrackingProvider>{children}</GrowthTrackingProvider>
    </NotificationProvider>
  );

  it("provides empty measurements initially", () => {
    render(
      <TestWrapper>
        <TestConsumer />
      </TestWrapper>,
    );

    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("preferred-standard")).toHaveTextContent("who");
  });

  it("adds a height measurement", async () => {
    render(
      <TestWrapper>
        <TestConsumer />
      </TestWrapper>,
    );

    await act(async () => {
      screen.getByTestId("add-height").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });
    expect(screen.getByTestId("first-type")).toHaveTextContent("height");
    expect(screen.getByTestId("first-value")).toHaveTextContent("75.5");
    expect(screen.getByTestId("first-childId")).toHaveTextContent("child-1");
  });

  it("adds a weight measurement", async () => {
    render(
      <TestWrapper>
        <TestConsumer />
      </TestWrapper>,
    );

    await act(async () => {
      screen.getByTestId("add-weight").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("first-type")).toHaveTextContent("weight");
    });
    expect(screen.getByTestId("first-value")).toHaveTextContent("9.5");
  });

  it("adds a head circumference measurement", async () => {
    render(
      <TestWrapper>
        <TestConsumer />
      </TestWrapper>,
    );

    await act(async () => {
      screen.getByTestId("add-head").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("first-type")).toHaveTextContent(
        "head_circumference",
      );
    });
    expect(screen.getByTestId("first-value")).toHaveTextContent("46.2");
  });

  it("filters measurements by childId", async () => {
    render(
      <TestWrapper>
        <TestConsumer />
      </TestWrapper>,
    );

    await act(async () => {
      screen.getByTestId("add-height").props.onPress();
    });
    await act(async () => {
      screen.getByTestId("add-child2-height").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("2");
    });
    expect(screen.getByTestId("child1-count")).toHaveTextContent("1");
  });

  it("filters measurements by type", async () => {
    render(
      <TestWrapper>
        <TestConsumer />
      </TestWrapper>,
    );

    await act(async () => {
      screen.getByTestId("add-height").props.onPress();
    });
    await act(async () => {
      screen.getByTestId("add-weight").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("2");
    });
    expect(screen.getByTestId("child1-height-count")).toHaveTextContent("1");
  });

  it("deletes a measurement", async () => {
    render(
      <TestWrapper>
        <TestConsumer />
      </TestWrapper>,
    );

    await act(async () => {
      screen.getByTestId("add-height").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });

    await act(async () => {
      screen.getByTestId("delete-first").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("0");
    });
  });

  it("calculates percentile within normal range", async () => {
    render(
      <TestWrapper>
        <TestConsumer />
      </TestWrapper>,
    );

    await act(async () => {
      screen.getByTestId("add-height").props.onPress(); // 75.5cm at 12mo
    });

    await waitFor(() => {
      expect(screen.getByTestId("percentile")).not.toHaveTextContent("none");
    });
    // 75.5cm at 12 months for boy is near 50th percentile (WHO: p50=75.7)
    expect(screen.getByTestId("percentile-normal")).toHaveTextContent("true");
    expect(screen.getByTestId("percentile-desc")).toHaveTextContent(
      "15th-50th percentile",
    );
  });

  it("calculates percentile below normal range", async () => {
    render(
      <TestWrapper>
        <TestConsumer />
      </TestWrapper>,
    );

    await act(async () => {
      screen.getByTestId("add-low-height").props.onPress(); // 68cm at 12mo
    });

    await waitFor(() => {
      expect(screen.getByTestId("percentile-normal")).toHaveTextContent(
        "false",
      );
    });
    expect(screen.getByTestId("percentile-desc")).toHaveTextContent(
      "Below 3rd percentile",
    );
  });

  it("calculates percentile above normal range", async () => {
    render(
      <TestWrapper>
        <TestConsumer />
      </TestWrapper>,
    );

    await act(async () => {
      screen.getByTestId("add-high-height").props.onPress(); // 82cm at 12mo
    });

    await waitFor(() => {
      expect(screen.getByTestId("percentile-normal")).toHaveTextContent(
        "false",
      );
    });
    expect(screen.getByTestId("percentile-desc")).toHaveTextContent(
      "Above 97th percentile",
    );
  });

  it("gets latest measurement by type", async () => {
    render(
      <TestWrapper>
        <TestConsumer />
      </TestWrapper>,
    );

    await act(async () => {
      screen.getByTestId("add-height").props.onPress(); // 75.5cm June 15
    });
    await act(async () => {
      screen.getByTestId("add-height-with-photo").props.onPress(); // 78.0cm July 20
    });
    await act(async () => {
      screen.getByTestId("add-weight").props.onPress(); // 9.5kg
    });

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("3");
    });
    // Latest height should be 78.0 (July 20 is after June 15)
    expect(screen.getByTestId("latest-height")).toHaveTextContent("78");
    expect(screen.getByTestId("latest-weight")).toHaveTextContent("9.5");
  });

  it("changes preferred standard", async () => {
    render(
      <TestWrapper>
        <TestConsumer />
      </TestWrapper>,
    );

    expect(screen.getByTestId("preferred-standard")).toHaveTextContent("who");

    await act(async () => {
      screen.getByTestId("set-singapore").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("preferred-standard")).toHaveTextContent(
        "singapore",
      );
    });
  });

  it("throws when useGrowthTracking is used outside GrowthTrackingProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    expect(() => render(<TestConsumer />)).toThrow(
      "useGrowthTracking must be used within a GrowthTrackingProvider",
    );

    consoleSpy.mockRestore();
  });

  // GROWTH-004: Singapore growth standards tests
  describe("GROWTH-004: Singapore Standards", () => {
    it("defaults to WHO standard", () => {
      render(
        <TestWrapper>
          <TestConsumer />
        </TestWrapper>,
      );

      expect(screen.getByTestId("preferred-standard")).toHaveTextContent("who");
    });

    it("can switch to Singapore standard", async () => {
      render(
        <TestWrapper>
          <TestConsumer />
        </TestWrapper>,
      );

      await act(async () => {
        screen.getByTestId("set-singapore").props.onPress();
      });

      await waitFor(() => {
        expect(screen.getByTestId("preferred-standard")).toHaveTextContent(
          "singapore",
        );
      });
    });

    it("calculates percentile using Singapore standard when selected", async () => {
      render(
        <NotificationProvider>
          <GrowthTrackingProvider>
            <TestConsumerWithSingapore />
          </GrowthTrackingProvider>
        </NotificationProvider>,
      );

      // Switch to Singapore standard
      await act(async () => {
        screen.getByTestId("set-singapore").props.onPress();
      });

      await waitFor(() => {
        expect(screen.getByTestId("preferred-standard")).toHaveTextContent(
          "singapore",
        );
      });

      // Add a height measurement
      await act(async () => {
        screen.getByTestId("add-sg-height").props.onPress();
      });

      // Check that Singapore percentile was calculated
      await waitFor(() => {
        expect(screen.getByTestId("sg-percentile-desc")).not.toHaveTextContent(
          "none",
        );
      });
    });
  });

  // GROWTH-008: Growth milestone alerts tests
  describe("GROWTH-008: Growth Milestone Alerts", () => {
    // Wrapper with all required providers
    const AlertTestWrapper = ({ children }: { children: React.ReactNode }) => (
      <NotificationProvider>
        <ChildProvider>
          <GrowthTrackingProvider>{children}</GrowthTrackingProvider>
        </ChildProvider>
      </NotificationProvider>
    );

    // Test consumer for alert tests
    function AlertTestConsumer() {
      const {
        addMeasurement,
        checkGrowthAlert,
        alertsEnabled,
        setAlertsEnabled,
      } = useGrowthTracking();
      const { setChild, child } = useChild();

      return (
        <>
          <Text testID="alerts-enabled">{alertsEnabled.toString()}</Text>
          <Text testID="child-name">{child?.name ?? "none"}</Text>
          <Text
            testID="setup-child"
            onPress={() =>
              setChild({
                id: "child-1",
                name: "Emma",
                dateOfBirth: "2023-06-15",
                sex: "female",
              })
            }
          >
            Setup Child
          </Text>
          <Text
            testID="toggle-alerts"
            onPress={() => setAlertsEnabled(!alertsEnabled)}
          >
            Toggle Alerts
          </Text>
          <Text
            testID="add-low-measurement"
            onPress={() =>
              addMeasurement({
                type: "height",
                value: 66.0, // Below 3rd percentile for 12mo girl (WHO: p3=68.9)
                date: "2024-06-15",
                childId: "child-1",
              })
            }
          >
            Add Low
          </Text>
          <Text
            testID="add-high-measurement"
            onPress={() =>
              addMeasurement({
                type: "weight",
                value: 12.0, // Above 97th percentile for 12mo girl (WHO: p97=11.5)
                date: "2024-06-15",
                childId: "child-1",
              })
            }
          >
            Add High
          </Text>
          <Text
            testID="add-normal-measurement"
            onPress={() =>
              addMeasurement({
                type: "height",
                value: 74.0, // Normal range for 12mo girl
                date: "2024-06-15",
                childId: "child-1",
              })
            }
          >
            Add Normal
          </Text>
          <Text
            testID="check-alert"
            onPress={async () => {
              if (child && child.sex) {
                await checkGrowthAlert(
                  "child-1",
                  child.name,
                  child.dateOfBirth,
                  child.sex,
                );
              }
            }}
          >
            Check Alert
          </Text>
        </>
      );
    }

    it("provides alertsEnabled state defaulting to true", () => {
      render(
        <AlertTestWrapper>
          <AlertTestConsumer />
        </AlertTestWrapper>,
      );

      expect(screen.getByTestId("alerts-enabled")).toHaveTextContent("true");
    });

    it("can toggle alerts enabled/disabled", async () => {
      render(
        <AlertTestWrapper>
          <AlertTestConsumer />
        </AlertTestWrapper>,
      );

      expect(screen.getByTestId("alerts-enabled")).toHaveTextContent("true");

      await act(async () => {
        screen.getByTestId("toggle-alerts").props.onPress();
      });

      await waitFor(() => {
        expect(screen.getByTestId("alerts-enabled")).toHaveTextContent("false");
      });
    });

    it("provides checkGrowthAlert method", () => {
      const { result } = require("@testing-library/react-native").renderHook(
        () => useGrowthTracking(),
        {
          wrapper: AlertTestWrapper,
        },
      );

      expect(typeof result.current.checkGrowthAlert).toBe("function");
    });

    it("sends notification when measurement is below 3rd percentile", async () => {
      const Notifications = require("expo-notifications");
      Notifications.scheduleNotificationAsync.mockClear();

      render(
        <AlertTestWrapper>
          <AlertTestConsumer />
        </AlertTestWrapper>,
      );

      // Setup child first
      await act(async () => {
        screen.getByTestId("setup-child").props.onPress();
      });

      await waitFor(() => {
        expect(screen.getByTestId("child-name")).toHaveTextContent("Emma");
      });

      // Add low measurement
      await act(async () => {
        screen.getByTestId("add-low-measurement").props.onPress();
      });

      // Trigger alert check
      await act(async () => {
        screen.getByTestId("check-alert").props.onPress();
      });

      // Verify notification was sent
      await waitFor(() => {
        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            content: expect.objectContaining({
              title: expect.stringContaining("Growth Update"),
              data: expect.objectContaining({ type: "growth_alert" }),
            }),
          }),
        );
      });
    });

    it("sends notification when measurement is above 97th percentile", async () => {
      const Notifications = require("expo-notifications");
      Notifications.scheduleNotificationAsync.mockClear();

      render(
        <AlertTestWrapper>
          <AlertTestConsumer />
        </AlertTestWrapper>,
      );

      // Setup child first
      await act(async () => {
        screen.getByTestId("setup-child").props.onPress();
      });

      await waitFor(() => {
        expect(screen.getByTestId("child-name")).toHaveTextContent("Emma");
      });

      // Add high measurement
      await act(async () => {
        screen.getByTestId("add-high-measurement").props.onPress();
      });

      // Trigger alert check
      await act(async () => {
        screen.getByTestId("check-alert").props.onPress();
      });

      // Verify notification was sent
      await waitFor(() => {
        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            content: expect.objectContaining({
              data: expect.objectContaining({
                type: "growth_alert",
                direction: "above",
              }),
            }),
          }),
        );
      });
    });

    it("does not send notification for normal range measurements", async () => {
      const Notifications = require("expo-notifications");
      Notifications.scheduleNotificationAsync.mockClear();

      render(
        <AlertTestWrapper>
          <AlertTestConsumer />
        </AlertTestWrapper>,
      );

      // Setup child first
      await act(async () => {
        screen.getByTestId("setup-child").props.onPress();
      });

      // Add normal measurement
      await act(async () => {
        screen.getByTestId("add-normal-measurement").props.onPress();
      });

      // Trigger alert check
      await act(async () => {
        screen.getByTestId("check-alert").props.onPress();
      });

      // Wait a bit to ensure no notification
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify no notification was sent
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it("does not send notification when alerts are disabled", async () => {
      const Notifications = require("expo-notifications");
      Notifications.scheduleNotificationAsync.mockClear();

      render(
        <AlertTestWrapper>
          <AlertTestConsumer />
        </AlertTestWrapper>,
      );

      // Setup child first
      await act(async () => {
        screen.getByTestId("setup-child").props.onPress();
      });

      // Disable alerts
      await act(async () => {
        screen.getByTestId("toggle-alerts").props.onPress();
      });

      await waitFor(() => {
        expect(screen.getByTestId("alerts-enabled")).toHaveTextContent("false");
      });

      // Add low measurement
      await act(async () => {
        screen.getByTestId("add-low-measurement").props.onPress();
      });

      // Trigger alert check
      await act(async () => {
        screen.getByTestId("check-alert").props.onPress();
      });

      // Wait a bit to ensure no notification
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify no notification was sent
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });
});
