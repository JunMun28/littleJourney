import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ThemedText } from "@/components/themed-text";

describe("ThemedText", () => {
  describe("Rendering", () => {
    it("renders default text", () => {
      render(<ThemedText>Default Text</ThemedText>);
      expect(screen.getByText("Default Text")).toBeTruthy();
    });

    it("renders with title type", () => {
      render(<ThemedText type="title">Title Text</ThemedText>);
      expect(screen.getByText("Title Text")).toBeTruthy();
    });

    it("renders with subtitle type", () => {
      render(<ThemedText type="subtitle">Subtitle Text</ThemedText>);
      expect(screen.getByText("Subtitle Text")).toBeTruthy();
    });

    it("renders with hero type", () => {
      render(<ThemedText type="hero">Hero Text</ThemedText>);
      expect(screen.getByText("Hero Text")).toBeTruthy();
    });

    it("renders with heading type", () => {
      render(<ThemedText type="heading">Heading Text</ThemedText>);
      expect(screen.getByText("Heading Text")).toBeTruthy();
    });

    it("renders with subheading type", () => {
      render(<ThemedText type="subheading">Subheading Text</ThemedText>);
      expect(screen.getByText("Subheading Text")).toBeTruthy();
    });

    it("renders with body type", () => {
      render(<ThemedText type="body">Body Text</ThemedText>);
      expect(screen.getByText("Body Text")).toBeTruthy();
    });

    it("renders with bodyMedium type", () => {
      render(<ThemedText type="bodyMedium">Body Medium Text</ThemedText>);
      expect(screen.getByText("Body Medium Text")).toBeTruthy();
    });

    it("renders with bodySemibold type", () => {
      render(<ThemedText type="bodySemibold">Body Semibold Text</ThemedText>);
      expect(screen.getByText("Body Semibold Text")).toBeTruthy();
    });

    it("renders with caption type", () => {
      render(<ThemedText type="caption">Caption Text</ThemedText>);
      expect(screen.getByText("Caption Text")).toBeTruthy();
    });

    it("renders with label type", () => {
      render(<ThemedText type="label">Label Text</ThemedText>);
      expect(screen.getByText("Label Text")).toBeTruthy();
    });

    it("renders with link type", () => {
      render(<ThemedText type="link">Link Text</ThemedText>);
      expect(screen.getByText("Link Text")).toBeTruthy();
    });

    it("renders with defaultSemiBold type", () => {
      render(<ThemedText type="defaultSemiBold">SemiBold Text</ThemedText>);
      expect(screen.getByText("SemiBold Text")).toBeTruthy();
    });
  });

  describe("Styling", () => {
    it("applies custom styles", () => {
      const { getByText } = render(
        <ThemedText style={{ fontSize: 20 }}>Styled Text</ThemedText>
      );
      const text = getByText("Styled Text");
      expect(text.props.style).toContainEqual({ fontSize: 20 });
    });

    it("applies light color", () => {
      const { getByText } = render(
        <ThemedText lightColor="#FF0000">Light Color</ThemedText>
      );
      expect(getByText("Light Color")).toBeTruthy();
    });

    it("applies dark color", () => {
      const { getByText } = render(
        <ThemedText darkColor="#00FF00">Dark Color</ThemedText>
      );
      expect(getByText("Dark Color")).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("supports selectable prop", () => {
      const { getByText } = render(
        <ThemedText selectable>Selectable Text</ThemedText>
      );
      const text = getByText("Selectable Text");
      expect(text.props.selectable).toBe(true);
    });

    it("supports numberOfLines", () => {
      const { getByText } = render(
        <ThemedText numberOfLines={2}>Multi Line Text</ThemedText>
      );
      const text = getByText("Multi Line Text");
      expect(text.props.numberOfLines).toBe(2);
    });

    it("supports accessibilityLabel", () => {
      const { getByLabelText } = render(
        <ThemedText accessibilityLabel="Accessible Label">
          Display Text
        </ThemedText>
      );
      expect(getByLabelText("Accessible Label")).toBeTruthy();
    });

    it("supports accessibilityRole", () => {
      const { getByRole } = render(
        <ThemedText accessibilityRole="header">Header Text</ThemedText>
      );
      expect(getByRole("header")).toBeTruthy();
    });
  });

  describe("Snapshots", () => {
    it("matches default snapshot", () => {
      const tree = render(<ThemedText>Default</ThemedText>).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it("matches title snapshot", () => {
      const tree = render(<ThemedText type="title">Title</ThemedText>).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it("matches hero snapshot", () => {
      const tree = render(<ThemedText type="hero">Hero</ThemedText>).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});
