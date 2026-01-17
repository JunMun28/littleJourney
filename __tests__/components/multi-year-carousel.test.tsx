import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { MultiYearCarousel } from "@/components/multi-year-carousel";
import type { Memory } from "@/contexts/on-this-day-context";
import type { Entry } from "@/contexts/entry-context";

// Mock ThemedText
jest.mock("@/components/themed-text", () => ({
  ThemedText: ({ children, testID, style }: { children: React.ReactNode; testID?: string; style?: unknown }) => {
    const { Text } = require("react-native");
    return <Text testID={testID} style={style}>{children}</Text>;
  },
}));

// Mock useColorScheme
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));

// Mock theme constants
jest.mock("@/constants/theme", () => ({
  Colors: {
    light: {
      text: "#000",
      textMuted: "#666",
      backgroundSecondary: "#f5f5f5",
      backgroundTertiary: "#eee",
    },
    dark: {
      text: "#fff",
      textMuted: "#999",
      backgroundSecondary: "#333",
      backgroundTertiary: "#444",
    },
  },
  SemanticColors: {
    goldLight: "#FFF8DC",
  },
  Spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
}));

const createMockEntry = (id: string, date: string): Entry => ({
  id,
  type: "photo",
  mediaUris: [`https://example.com/photo-${id}.jpg`],
  caption: `Caption for ${id}`,
  date,
  createdAt: date,
  updatedAt: date,
});

const createMockMemory = (id: string, yearsAgo: number, date: string): Memory => ({
  id: `memory_${id}`,
  entry: createMockEntry(id, date),
  yearsAgo,
  year: new Date().getFullYear() - yearsAgo,
  isDismissed: false,
});

describe("MultiYearCarousel", () => {
  const currentYear = new Date().getFullYear();

  describe("rendering", () => {
    it("renders nothing when no memory groups provided", () => {
      const { queryByTestId } = render(
        <MultiYearCarousel
          memoryGroups={[]}
          onMemoryPress={jest.fn()}
          onDismiss={jest.fn()}
        />
      );

      expect(queryByTestId("multi-year-carousel")).toBeNull();
    });

    it("renders carousel with single year of memories", () => {
      const groups = [
        {
          year: currentYear - 1,
          yearsAgo: 1,
          memories: [createMockMemory("1", 1, `${currentYear - 1}-01-17`)],
        },
      ];

      const { getByTestId, getByText } = render(
        <MultiYearCarousel
          memoryGroups={groups}
          onMemoryPress={jest.fn()}
          onDismiss={jest.fn()}
        />
      );

      expect(getByTestId("multi-year-carousel")).toBeTruthy();
      expect(getByText("1 year ago")).toBeTruthy();
    });

    it("renders carousel with multiple years", () => {
      const groups = [
        {
          year: currentYear - 1,
          yearsAgo: 1,
          memories: [createMockMemory("1", 1, `${currentYear - 1}-01-17`)],
        },
        {
          year: currentYear - 2,
          yearsAgo: 2,
          memories: [createMockMemory("2", 2, `${currentYear - 2}-01-17`)],
        },
        {
          year: currentYear - 3,
          yearsAgo: 3,
          memories: [createMockMemory("3", 3, `${currentYear - 3}-01-17`)],
        },
      ];

      const { getByTestId, getAllByTestId } = render(
        <MultiYearCarousel
          memoryGroups={groups}
          onMemoryPress={jest.fn()}
          onDismiss={jest.fn()}
        />
      );

      expect(getByTestId("multi-year-carousel")).toBeTruthy();
      // Each year should have its own page
      expect(getAllByTestId(/year-page-/)).toHaveLength(3);
    });

    it("shows year indicator dots for multiple years", () => {
      const groups = [
        {
          year: currentYear - 1,
          yearsAgo: 1,
          memories: [createMockMemory("1", 1, `${currentYear - 1}-01-17`)],
        },
        {
          year: currentYear - 2,
          yearsAgo: 2,
          memories: [createMockMemory("2", 2, `${currentYear - 2}-01-17`)],
        },
      ];

      const { getByTestId } = render(
        <MultiYearCarousel
          memoryGroups={groups}
          onMemoryPress={jest.fn()}
          onDismiss={jest.fn()}
        />
      );

      expect(getByTestId("year-indicators")).toBeTruthy();
    });

    it("displays correct year label (singular for 1 year)", () => {
      const groups = [
        {
          year: currentYear - 1,
          yearsAgo: 1,
          memories: [createMockMemory("1", 1, `${currentYear - 1}-01-17`)],
        },
      ];

      const { getByText } = render(
        <MultiYearCarousel
          memoryGroups={groups}
          onMemoryPress={jest.fn()}
          onDismiss={jest.fn()}
        />
      );

      expect(getByText("1 year ago")).toBeTruthy();
    });

    it("displays correct year label (plural for multiple years)", () => {
      const groups = [
        {
          year: currentYear - 3,
          yearsAgo: 3,
          memories: [createMockMemory("1", 3, `${currentYear - 3}-01-17`)],
        },
      ];

      const { getByText } = render(
        <MultiYearCarousel
          memoryGroups={groups}
          onMemoryPress={jest.fn()}
          onDismiss={jest.fn()}
        />
      );

      expect(getByText("3 years ago")).toBeTruthy();
    });
  });

  describe("interactions", () => {
    it("calls onMemoryPress when memory is tapped", () => {
      const onMemoryPress = jest.fn();
      const memory = createMockMemory("1", 1, `${currentYear - 1}-01-17`);
      const groups = [
        {
          year: currentYear - 1,
          yearsAgo: 1,
          memories: [memory],
        },
      ];

      const { getByTestId } = render(
        <MultiYearCarousel
          memoryGroups={groups}
          onMemoryPress={onMemoryPress}
          onDismiss={jest.fn()}
        />
      );

      fireEvent.press(getByTestId(`memory-card-${memory.id}`));
      expect(onMemoryPress).toHaveBeenCalledWith(memory);
    });

    it("calls onDismiss when dismiss button is tapped", () => {
      const onDismiss = jest.fn();
      const groups = [
        {
          year: currentYear - 1,
          yearsAgo: 1,
          memories: [createMockMemory("1", 1, `${currentYear - 1}-01-17`)],
        },
      ];

      const { getByTestId } = render(
        <MultiYearCarousel
          memoryGroups={groups}
          onMemoryPress={jest.fn()}
          onDismiss={onDismiss}
        />
      );

      fireEvent.press(getByTestId("dismiss-memories"));
      expect(onDismiss).toHaveBeenCalled();
    });
  });

  describe("multiple memories per year", () => {
    it("shows multiple memories within a single year page", () => {
      const groups = [
        {
          year: currentYear - 1,
          yearsAgo: 1,
          memories: [
            createMockMemory("1", 1, `${currentYear - 1}-01-17`),
            createMockMemory("2", 1, `${currentYear - 1}-01-17`),
            createMockMemory("3", 1, `${currentYear - 1}-01-17`),
          ],
        },
      ];

      const { getAllByTestId } = render(
        <MultiYearCarousel
          memoryGroups={groups}
          onMemoryPress={jest.fn()}
          onDismiss={jest.fn()}
        />
      );

      expect(getAllByTestId(/memory-card-/)).toHaveLength(3);
    });

    it("shows memory count in year header when multiple memories", () => {
      const groups = [
        {
          year: currentYear - 1,
          yearsAgo: 1,
          memories: [
            createMockMemory("1", 1, `${currentYear - 1}-01-17`),
            createMockMemory("2", 1, `${currentYear - 1}-01-17`),
          ],
        },
      ];

      const { getByText } = render(
        <MultiYearCarousel
          memoryGroups={groups}
          onMemoryPress={jest.fn()}
          onDismiss={jest.fn()}
        />
      );

      expect(getByText("2 memories")).toBeTruthy();
    });
  });
});
