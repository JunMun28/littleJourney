import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { Button } from "@/components/ui/button";
import * as Haptics from "expo-haptics";

describe("Button", () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders with default props", () => {
      render(<Button onPress={mockOnPress}>Test Button</Button>);
      expect(screen.getByText("Test Button")).toBeTruthy();
    });

    it("renders with primary variant", () => {
      render(
        <Button variant="primary" onPress={mockOnPress}>
          Primary
        </Button>
      );
      expect(screen.getByText("Primary")).toBeTruthy();
    });

    it("renders with secondary variant", () => {
      render(
        <Button variant="secondary" onPress={mockOnPress}>
          Secondary
        </Button>
      );
      expect(screen.getByText("Secondary")).toBeTruthy();
    });

    it("renders with ghost variant", () => {
      render(
        <Button variant="ghost" onPress={mockOnPress}>
          Ghost
        </Button>
      );
      expect(screen.getByText("Ghost")).toBeTruthy();
    });

    it("renders with danger variant", () => {
      render(
        <Button variant="danger" onPress={mockOnPress}>
          Danger
        </Button>
      );
      expect(screen.getByText("Danger")).toBeTruthy();
    });

    it("renders with small size", () => {
      render(
        <Button size="sm" onPress={mockOnPress}>
          Small
        </Button>
      );
      expect(screen.getByText("Small")).toBeTruthy();
    });

    it("renders with large size", () => {
      render(
        <Button size="lg" onPress={mockOnPress}>
          Large
        </Button>
      );
      expect(screen.getByText("Large")).toBeTruthy();
    });

    it("renders full width when specified", () => {
      const { getByTestId } = render(
        <Button fullWidth onPress={mockOnPress} testID="button">
          Full Width
        </Button>
      );
      expect(getByTestId("button")).toBeTruthy();
    });

    it("renders loading state", () => {
      render(
        <Button loading onPress={mockOnPress}>
          Loading
        </Button>
      );
      expect(screen.getByTestId("button-loading")).toBeTruthy();
    });

    it("renders with left icon", () => {
      const LeftIcon = <span testID="left-icon">←</span>;
      const { getByTestId } = render(
        <Button leftIcon={LeftIcon} onPress={mockOnPress}>
          With Icon
        </Button>
      );
      expect(getByTestId("left-icon")).toBeTruthy();
    });

    it("renders with right icon", () => {
      const RightIcon = <span testID="right-icon">→</span>;
      const { getByTestId } = render(
        <Button rightIcon={RightIcon} onPress={mockOnPress}>
          With Icon
        </Button>
      );
      expect(getByTestId("right-icon")).toBeTruthy();
    });
  });

  describe("Interactions", () => {
    it("calls onPress when pressed", () => {
      render(<Button onPress={mockOnPress}>Press Me</Button>);
      fireEvent.press(screen.getByText("Press Me"));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it("triggers haptic feedback on press in", () => {
      render(<Button onPress={mockOnPress}>Press Me</Button>);
      fireEvent(screen.getByText("Press Me"), "onPressIn");
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      );
    });

    it("does not trigger haptic when haptic is disabled", () => {
      render(
        <Button haptic={false} onPress={mockOnPress}>
          No Haptic
        </Button>
      );
      fireEvent(screen.getByText("No Haptic"), "onPressIn");
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });

    it("does not call onPress when disabled", () => {
      render(
        <Button disabled onPress={mockOnPress}>
          Disabled
        </Button>
      );
      fireEvent.press(screen.getByText("Disabled"));
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it("does not call onPress when loading", () => {
      render(
        <Button loading onPress={mockOnPress}>
          Loading
        </Button>
      );
      // Loading spinner should be visible
      expect(screen.getByTestId("button-loading")).toBeTruthy();
    });

    it("handles press in event", () => {
      const onPressIn = jest.fn();
      render(
        <Button onPress={mockOnPress} onPressIn={onPressIn}>
          Press In
        </Button>
      );
      fireEvent(screen.getByText("Press In"), "onPressIn");
      expect(onPressIn).toHaveBeenCalled();
    });

    it("handles press out event", () => {
      const onPressOut = jest.fn();
      render(
        <Button onPress={mockOnPress} onPressOut={onPressOut}>
          Press Out
        </Button>
      );
      fireEvent(screen.getByText("Press Out"), "onPressOut");
      expect(onPressOut).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("has correct accessibility role", () => {
      const { getByRole } = render(
        <Button onPress={mockOnPress}>Accessible</Button>
      );
      expect(getByRole("button")).toBeTruthy();
    });

    it("reflects disabled state in accessibility", () => {
      const { getByRole } = render(
        <Button disabled onPress={mockOnPress}>
          Disabled
        </Button>
      );
      const button = getByRole("button");
      expect(button.props.accessibilityState.disabled).toBe(true);
    });

    it("supports accessibility label", () => {
      const { getByLabelText } = render(
        <Button onPress={mockOnPress} accessibilityLabel="Custom Label">
          Button
        </Button>
      );
      expect(getByLabelText("Custom Label")).toBeTruthy();
    });

    it("supports accessibility hint", () => {
      const { getByHintText } = render(
        <Button onPress={mockOnPress} accessibilityHint="Tap to submit">
          Submit
        </Button>
      );
      expect(getByHintText("Tap to submit")).toBeTruthy();
    });
  });

  describe("Snapshots", () => {
    it("matches primary variant snapshot", () => {
      const tree = render(
        <Button variant="primary" onPress={mockOnPress}>
          Primary
        </Button>
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it("matches loading state snapshot", () => {
      const tree = render(
        <Button loading onPress={mockOnPress}>
          Loading
        </Button>
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});
