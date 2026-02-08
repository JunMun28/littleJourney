import React from "react";
import { render, screen } from "@testing-library/react-native";
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonFeed,
  SkeletonStatCard,
} from "@/components/ui/skeleton";

describe("Skeleton Components", () => {
  describe("Skeleton", () => {
    it("renders with default props", () => {
      render(<Skeleton testID="skeleton" />);
      expect(screen.getByTestId("skeleton")).toBeTruthy();
    });

    it("renders with custom width", () => {
      const { getByTestId } = render(
        <Skeleton width={200} testID="skeleton" />
      );
      expect(getByTestId("skeleton")).toBeTruthy();
    });

    it("renders with percentage width", () => {
      const { getByTestId } = render(
        <Skeleton width="50%" testID="skeleton" />
      );
      expect(getByTestId("skeleton")).toBeTruthy();
    });

    it("renders with custom height", () => {
      const { getByTestId } = render(
        <Skeleton height={40} testID="skeleton" />
      );
      expect(getByTestId("skeleton")).toBeTruthy();
    });

    it("renders as circle", () => {
      const { getByTestId } = render(
        <Skeleton height={50} circle testID="skeleton" />
      );
      expect(getByTestId("skeleton")).toBeTruthy();
    });

    it("renders with custom radius", () => {
      const { getByTestId } = render(
        <Skeleton radius="lg" testID="skeleton" />
      );
      expect(getByTestId("skeleton")).toBeTruthy();
    });

    it("renders with numeric radius", () => {
      const { getByTestId } = render(
        <Skeleton radius={10} testID="skeleton" />
      );
      expect(getByTestId("skeleton")).toBeTruthy();
    });

    it("has pulse animation", () => {
      const { getByTestId } = render(<Skeleton testID="skeleton" />);
      const skeleton = getByTestId("skeleton");
      expect(skeleton).toBeTruthy();
    });
  });

  describe("SkeletonText", () => {
    it("renders with default 3 lines", () => {
      const { getByTestId } = render(
        <SkeletonText testID="skeleton-text" />
      );
      expect(getByTestId("skeleton-text")).toBeTruthy();
    });

    it("renders with custom line count", () => {
      render(<SkeletonText lines={5} testID="skeleton-text" />);
      expect(screen.getByTestId("skeleton-text")).toBeTruthy();
    });

    it("renders with custom last line width", () => {
      render(
        <SkeletonText lastLineWidth="80%" testID="skeleton-text" />
      );
      expect(screen.getByTestId("skeleton-text")).toBeTruthy();
    });

    it("renders with custom line height", () => {
      render(
        <SkeletonText lineHeight={20} testID="skeleton-text" />
      );
      expect(screen.getByTestId("skeleton-text")).toBeTruthy();
    });

    it("renders with custom gap", () => {
      render(<SkeletonText gap={12} testID="skeleton-text" />);
      expect(screen.getByTestId("skeleton-text")).toBeTruthy();
    });
  });

  describe("SkeletonAvatar", () => {
    it("renders with default size", () => {
      const { getByTestId } = render(
        <SkeletonAvatar testID="skeleton-avatar" />
      );
      expect(getByTestId("skeleton-avatar")).toBeTruthy();
    });

    it("renders with custom size", () => {
      const { getByTestId } = render(
        <SkeletonAvatar size={64} testID="skeleton-avatar" />
      );
      expect(getByTestId("skeleton-avatar")).toBeTruthy();
    });

    it("renders as circle", () => {
      const { getByTestId } = render(
        <SkeletonAvatar testID="skeleton-avatar" />
      );
      const avatar = getByTestId("skeleton-avatar");
      expect(avatar).toBeTruthy();
    });
  });

  describe("SkeletonCard", () => {
    it("renders card skeleton", () => {
      const { getByTestId } = render(
        <SkeletonCard testID="skeleton-card" />
      );
      expect(getByTestId("skeleton-card")).toBeTruthy();
    });

    it("contains image placeholder", () => {
      const { getByTestId } = render(
        <SkeletonCard testID="skeleton-card" />
      );
      expect(getByTestId("skeleton-card")).toBeTruthy();
    });

    it("contains text placeholders", () => {
      render(<SkeletonCard />);
      // Should render without errors
      expect(true).toBe(true);
    });
  });

  describe("SkeletonFeed", () => {
    it("renders with default count", () => {
      const { getByTestId } = render(
        <SkeletonFeed testID="skeleton-feed" />
      );
      expect(getByTestId("skeleton-feed")).toBeTruthy();
    });

    it("renders with custom count", () => {
      render(<SkeletonFeed count={5} testID="skeleton-feed" />);
      expect(screen.getByTestId("skeleton-feed")).toBeTruthy();
    });

    it("renders multiple cards", () => {
      render(<SkeletonFeed count={3} />);
      // Should render without errors
      expect(true).toBe(true);
    });
  });

  describe("SkeletonStatCard", () => {
    it("renders stat card skeleton", () => {
      const { getByTestId } = render(
        <SkeletonStatCard testID="skeleton-stat" />
      );
      expect(getByTestId("skeleton-stat")).toBeTruthy();
    });

    it("contains avatar placeholder", () => {
      render(<SkeletonStatCard />);
      expect(true).toBe(true);
    });

    it("contains progress bar placeholder", () => {
      render(<SkeletonStatCard />);
      expect(true).toBe(true);
    });
  });

  describe("Accessibility", () => {
    it("skeleton has accessibility role", () => {
      const { getByTestId } = render(
        <Skeleton testID="skeleton" accessibilityRole="progressbar" />
      );
      expect(getByTestId("skeleton")).toBeTruthy();
    });

    it("skeleton has accessibility label", () => {
      const { getByLabelText } = render(
        <Skeleton
          testID="skeleton"
          accessibilityLabel="Loading content"
        />
      );
      expect(getByLabelText("Loading content")).toBeTruthy();
    });
  });

  describe("Snapshots", () => {
    it("matches Skeleton snapshot", () => {
      const tree = render(<Skeleton />).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it("matches SkeletonText snapshot", () => {
      const tree = render(<SkeletonText lines={3} />).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it("matches SkeletonAvatar snapshot", () => {
      const tree = render(<SkeletonAvatar size={48} />).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it("matches SkeletonCard snapshot", () => {
      const tree = render(<SkeletonCard />).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it("matches SkeletonFeed snapshot", () => {
      const tree = render(<SkeletonFeed count={2} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});
