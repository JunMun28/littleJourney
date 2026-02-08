import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import { Card, CardHeader, CardFooter } from "@/components/ui/card";
import * as Haptics from "expo-haptics";

describe("Card", () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders children", () => {
      render(
        <Card testID="card">
          <Text>Card Content</Text>
        </Card>
      );
      expect(screen.getByTestId("card")).toBeTruthy();
    });

    it("renders with default variant", () => {
      const { getByTestId } = render(
        <Card testID="card">
          <Text>Content</Text>
        </Card>
      );
      expect(getByTestId("card")).toBeTruthy();
    });

    it("renders with elevated variant", () => {
      render(
        <Card variant="elevated" testID="card">
          <Text>Elevated</Text>
        </Card>
      );
      expect(screen.getByTestId("card")).toBeTruthy();
    });

    it("renders with outlined variant", () => {
      render(
        <Card variant="outlined" testID="card">
          <Text>Outlined</Text>
        </Card>
      );
      expect(screen.getByTestId("card")).toBeTruthy();
    });

    it("renders with highlighted variant", () => {
      render(
        <Card variant="highlighted" testID="card">
          <Text>Highlighted</Text>
        </Card>
      );
      expect(screen.getByTestId("card")).toBeTruthy();
    });

    it("renders with custom padding", () => {
      render(
        <Card padding="sm" testID="card">
          <Text>Small Padding</Text>
        </Card>
      );
      expect(screen.getByTestId("card")).toBeTruthy();
    });

    it("renders with numeric padding", () => {
      render(
        <Card padding={20} testID="card">
          <Text>Numeric Padding</Text>
        </Card>
      );
      expect(screen.getByTestId("card")).toBeTruthy();
    });

    it("renders with entrance animation", () => {
      render(
        <Card animateEntrance enterIndex={0} testID="card">
          <Text>Animated</Text>
        </Card>
      );
      expect(screen.getByTestId("card")).toBeTruthy();
    });
  });

  describe("Interactivity", () => {
    it("calls onPress when pressed", () => {
      render(
        <Card onPress={mockOnPress} testID="card">
          <Text>Pressable Card</Text>
        </Card>
      );
      fireEvent.press(screen.getByTestId("card"));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it("triggers haptic feedback when pressed", () => {
      render(
        <Card onPress={mockOnPress} testID="card">
          <Text>Pressable Card</Text>
        </Card>
      );
      fireEvent(screen.getByTestId("card"), "onPressIn");
      expect(Haptics.impactAsync).toHaveBeenCalled();
    });

    it("does not trigger haptic when disabled", () => {
      render(
        <Card onPress={mockOnPress} haptic={false} testID="card">
          <Text>No Haptic</Text>
        </Card>
      );
      fireEvent(screen.getByTestId("card"), "onPressIn");
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });

    it("is not interactive without onPress", () => {
      const { getByTestId } = render(
        <Card testID="card">
          <Text>Non-Interactive</Text>
        </Card>
      );
      expect(getByTestId("card")).toBeTruthy();
    });
  });

  describe("CardHeader", () => {
    it("renders header content", () => {
      const { getByTestId } = render(
        <Card>
          <CardHeader testID="card-header">
            <Text>Header Content</Text>
          </CardHeader>
        </Card>
      );
      expect(getByTestId("card-header")).toBeTruthy();
    });
  });

  describe("CardFooter", () => {
    it("renders footer content", () => {
      const { getByTestId } = render(
        <Card>
          <CardFooter testID="card-footer">
            <Text>Footer Content</Text>
          </CardFooter>
        </Card>
      );
      expect(getByTestId("card-footer")).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("has button role when interactive", () => {
      const { getByRole } = render(
        <Card onPress={mockOnPress}>
          <Text>Interactive</Text>
        </Card>
      );
      expect(getByRole("button")).toBeTruthy();
    });

    it("supports testID", () => {
      const { getByTestId } = render(
        <Card testID="test-card">
          <Text>Content</Text>
        </Card>
      );
      expect(getByTestId("test-card")).toBeTruthy();
    });
  });

  describe("Snapshots", () => {
    it("matches default snapshot", () => {
      const tree = render(
        <Card>
          <Text>Content</Text>
        </Card>
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it("matches elevated variant snapshot", () => {
      const tree = render(
        <Card variant="elevated">
          <Text>Elevated</Text>
        </Card>
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it("matches interactive snapshot", () => {
      const tree = render(
        <Card onPress={mockOnPress}>
          <Text>Interactive</Text>
        </Card>
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});
