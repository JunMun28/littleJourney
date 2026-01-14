import { render, screen } from "@testing-library/react-native";
import { ThemedText } from "@/components/themed-text";

describe("<ThemedText />", () => {
  it("renders text content correctly", () => {
    render(<ThemedText>Hello World</ThemedText>);
    expect(screen.getByText("Hello World")).toBeOnTheScreen();
  });

  it("renders with title type", () => {
    render(<ThemedText type="title">Title Text</ThemedText>);
    const element = screen.getByText("Title Text");
    expect(element).toBeOnTheScreen();
  });

  it("renders with subtitle type", () => {
    render(<ThemedText type="subtitle">Subtitle Text</ThemedText>);
    expect(screen.getByText("Subtitle Text")).toBeOnTheScreen();
  });

  it("renders with link type", () => {
    render(<ThemedText type="link">Link Text</ThemedText>);
    expect(screen.getByText("Link Text")).toBeOnTheScreen();
  });

  it("renders with defaultSemiBold type", () => {
    render(<ThemedText type="defaultSemiBold">Bold Text</ThemedText>);
    expect(screen.getByText("Bold Text")).toBeOnTheScreen();
  });
});
