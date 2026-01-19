import { render, act, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import {
  FamilyDigestProvider,
  useFamilyDigest,
  calculatePeriodStart,
  calculateNextScheduledDate,
} from "@/contexts/family-digest-context";
import { EntryProvider, useEntries } from "@/contexts/entry-context";
import { MilestoneProvider } from "@/contexts/milestone-context";

// Test component that uses the context
function TestConsumer({
  onValues,
}: {
  onValues: (values: ReturnType<typeof useFamilyDigest>) => void;
}) {
  const values = useFamilyDigest();
  onValues(values);
  return <Text testID="test-consumer">Consumer</Text>;
}

// Helper to add entries for testing
function EntryAdder({
  onAddEntry,
}: {
  onAddEntry: (addEntry: ReturnType<typeof useEntries>["addEntry"]) => void;
}) {
  const { addEntry } = useEntries();
  onAddEntry(addEntry);
  return null;
}

function renderWithProvider(
  onValues: (values: ReturnType<typeof useFamilyDigest>) => void,
  onAddEntry?: (addEntry: ReturnType<typeof useEntries>["addEntry"]) => void,
) {
  return render(
    <EntryProvider>
      <MilestoneProvider>
        <FamilyDigestProvider>
          <TestConsumer onValues={onValues} />
          {onAddEntry && <EntryAdder onAddEntry={onAddEntry} />}
        </FamilyDigestProvider>
      </MilestoneProvider>
    </EntryProvider>,
  );
}

describe("FamilyDigestContext", () => {
  describe("initial state", () => {
    it("should start with empty digest configs", () => {
      let contextValues: ReturnType<typeof useFamilyDigest> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      expect(contextValues).not.toBeNull();
      expect(contextValues!.digestConfigs).toEqual([]);
    });
  });

  describe("enableDigest", () => {
    it("should enable weekly email digest for family member", async () => {
      let contextValues: ReturnType<typeof useFamilyDigest> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      await act(async () => {
        contextValues!.enableDigest("member-1", "weekly", "email");
      });

      await waitFor(() => {
        const config = contextValues!.getDigestConfig("member-1");
        expect(config).not.toBeUndefined();
        expect(config!.enabled).toBe(true);
        expect(config!.frequency).toBe("weekly");
        expect(config!.deliveryMethod).toBe("email");
      });
    });

    it("should enable daily WhatsApp digest with phone number", async () => {
      let contextValues: ReturnType<typeof useFamilyDigest> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      await act(async () => {
        contextValues!.enableDigest(
          "member-1",
          "daily",
          "whatsapp",
          "+6591234567",
        );
      });

      await waitFor(() => {
        const config = contextValues!.getDigestConfig("member-1");
        expect(config!.deliveryMethod).toBe("whatsapp");
        expect(config!.whatsappNumber).toBe("+6591234567");
      });
    });

    it("should set nextScheduledAt when enabling digest", async () => {
      let contextValues: ReturnType<typeof useFamilyDigest> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      await act(async () => {
        contextValues!.enableDigest("member-1", "weekly", "email");
      });

      await waitFor(() => {
        const config = contextValues!.getDigestConfig("member-1");
        expect(config!.nextScheduledAt).toBeDefined();
      });
    });
  });

  describe("disableDigest", () => {
    it("should disable digest for family member", async () => {
      let contextValues: ReturnType<typeof useFamilyDigest> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      await act(async () => {
        contextValues!.enableDigest("member-1", "weekly", "email");
      });

      await act(async () => {
        contextValues!.disableDigest("member-1");
      });

      await waitFor(() => {
        const config = contextValues!.getDigestConfig("member-1");
        expect(config!.enabled).toBe(false);
        expect(config!.nextScheduledAt).toBeUndefined();
      });
    });
  });

  describe("updateDigestConfig", () => {
    it("should update frequency for existing config", async () => {
      let contextValues: ReturnType<typeof useFamilyDigest> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      await act(async () => {
        contextValues!.enableDigest("member-1", "weekly", "email");
      });

      await act(async () => {
        contextValues!.updateDigestConfig("member-1", { frequency: "monthly" });
      });

      await waitFor(() => {
        const config = contextValues!.getDigestConfig("member-1");
        expect(config!.frequency).toBe("monthly");
      });
    });
  });

  describe("generateDigestContent", () => {
    it("should return null when no entries in period", () => {
      let contextValues: ReturnType<typeof useFamilyDigest> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      const content = contextValues!.generateDigestContent(
        "member-1",
        "weekly",
      );
      expect(content).toBeNull();
    });

    it("should generate content with entries from period", async () => {
      let contextValues: ReturnType<typeof useFamilyDigest> | null = null;
      let addEntryFn: ReturnType<typeof useEntries>["addEntry"] | null = null;

      renderWithProvider(
        (values) => {
          contextValues = values;
        },
        (addEntry) => {
          addEntryFn = addEntry;
        },
      );

      // Add entry from today (should be in weekly period)
      await act(async () => {
        addEntryFn!({
          type: "photo",
          date: new Date().toISOString().split("T")[0],
          mediaUris: ["test.jpg"],
          caption: "Test photo",
        });
      });

      await waitFor(() => {
        const content = contextValues!.generateDigestContent(
          "member-1",
          "weekly",
        );
        expect(content).not.toBeNull();
        expect(content!.entries.length).toBe(1);
        expect(content!.totalPhotos).toBe(1);
      });
    });
  });

  describe("markDigestSent", () => {
    it("should update lastSentAt and nextScheduledAt", async () => {
      let contextValues: ReturnType<typeof useFamilyDigest> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      await act(async () => {
        contextValues!.enableDigest("member-1", "weekly", "email");
      });

      await act(async () => {
        contextValues!.markDigestSent("member-1");
      });

      await waitFor(() => {
        const config = contextValues!.getDigestConfig("member-1");
        expect(config!.lastSentAt).toBeDefined();
        expect(config!.nextScheduledAt).toBeDefined();
      });
    });
  });

  describe("useFamilyDigest hook", () => {
    it("should throw error when used outside provider", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(
          <EntryProvider>
            <MilestoneProvider>
              <TestConsumer onValues={() => {}} />
            </MilestoneProvider>
          </EntryProvider>,
        );
      }).toThrow("useFamilyDigest must be used within a FamilyDigestProvider");

      consoleSpy.mockRestore();
    });
  });
});

// Pure function tests
describe("calculatePeriodStart", () => {
  it("should calculate daily period start (1 day back)", () => {
    const endDate = new Date("2026-01-15T12:00:00Z");
    const start = calculatePeriodStart("daily", endDate);
    expect(start.toISOString().split("T")[0]).toBe("2026-01-14");
  });

  it("should calculate weekly period start (7 days back)", () => {
    const endDate = new Date("2026-01-15T12:00:00Z");
    const start = calculatePeriodStart("weekly", endDate);
    expect(start.toISOString().split("T")[0]).toBe("2026-01-08");
  });

  it("should calculate monthly period start (1 month back)", () => {
    const endDate = new Date("2026-01-15T12:00:00Z");
    const start = calculatePeriodStart("monthly", endDate);
    expect(start.getMonth()).toBe(11); // December
    expect(start.getDate()).toBe(15);
  });
});

describe("calculateNextScheduledDate", () => {
  it("should calculate next daily schedule (1 day forward)", () => {
    const fromDate = new Date("2026-01-15T12:00:00Z");
    const next = calculateNextScheduledDate("daily", fromDate);
    expect(next.toISOString().split("T")[0]).toBe("2026-01-16");
  });

  it("should calculate next weekly schedule (7 days forward)", () => {
    const fromDate = new Date("2026-01-15T12:00:00Z");
    const next = calculateNextScheduledDate("weekly", fromDate);
    expect(next.toISOString().split("T")[0]).toBe("2026-01-22");
  });

  it("should calculate next monthly schedule (1 month forward)", () => {
    const fromDate = new Date("2026-01-15T12:00:00Z");
    const next = calculateNextScheduledDate("monthly", fromDate);
    expect(next.getMonth()).toBe(1); // February
    expect(next.getDate()).toBe(15);
  });
});
