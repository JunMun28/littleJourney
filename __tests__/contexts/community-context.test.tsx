import { render, act, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { CommunityProvider, useCommunity } from "@/contexts/community-context";

// Test component that uses the context
function TestConsumer({
  onValues,
}: {
  onValues: (values: ReturnType<typeof useCommunity>) => void;
}) {
  const values = useCommunity();
  onValues(values);
  return <Text testID="test-consumer">Consumer</Text>;
}

function renderWithProvider(
  onValues: (values: ReturnType<typeof useCommunity>) => void,
) {
  return render(
    <CommunityProvider>
      <TestConsumer onValues={onValues} />
    </CommunityProvider>,
  );
}

describe("CommunityContext", () => {
  describe("initial state", () => {
    it("should default communityDataSharingEnabled to false", () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      expect(contextValues).not.toBeNull();
      expect(contextValues!.communityDataSharingEnabled).toBe(false);
    });

    it("should provide explanation text for what is shared", () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      expect(contextValues!.sharingExplanation).toBeDefined();
      expect(contextValues!.sharingExplanation.length).toBeGreaterThan(0);
    });
  });

  describe("setCommunityDataSharingEnabled", () => {
    it("should enable community sharing", async () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      await act(async () => {
        contextValues!.setCommunityDataSharingEnabled(true);
      });

      await waitFor(() => {
        expect(contextValues!.communityDataSharingEnabled).toBe(true);
      });
    });

    it("should disable community sharing", async () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      // First enable
      await act(async () => {
        contextValues!.setCommunityDataSharingEnabled(true);
      });

      // Then disable
      await act(async () => {
        contextValues!.setCommunityDataSharingEnabled(false);
      });

      await waitFor(() => {
        expect(contextValues!.communityDataSharingEnabled).toBe(false);
      });
    });
  });

  describe("useCommunity hook", () => {
    it("should throw error when used outside provider", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer onValues={() => {}} />);
      }).toThrow("useCommunity must be used within a CommunityProvider");

      consoleSpy.mockRestore();
    });
  });
});
