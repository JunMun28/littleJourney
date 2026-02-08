import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import SignInScreen from "@/app/(auth)/sign-in";
import { useAuth } from "@/contexts/auth-context";

// Mock useAuth
jest.mock("@/contexts/auth-context", () => ({
  useAuth: jest.fn(),
}));

describe("Auth Flow Integration", () => {
  const mockSignIn = jest.fn();
  const mockUseAuth = useAuth as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      user: null,
      isLoading: false,
    });
  });

  describe("Sign In Screen", () => {
    it("renders sign in screen correctly", () => {
      render(<SignInScreen />);
      expect(screen.getByPlaceholderText("Enter your email")).toBeTruthy();
      expect(screen.getByText("Send Magic Link")).toBeTruthy();
    });

    it("allows email input", () => {
      render(<SignInScreen />);
      const emailInput = screen.getByPlaceholderText("Enter your email");
      fireEvent.changeText(emailInput, "test@example.com");
      expect(emailInput.props.value).toBe("test@example.com");
    });

    it("validates email format", async () => {
      render(<SignInScreen />);
      const emailInput = screen.getByPlaceholderText("Enter your email");
      const submitButton = screen.getByText("Send Magic Link");

      fireEvent.changeText(emailInput, "invalid-email");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(submitButton.props.accessibilityState.disabled).toBe(true);
      });
    });

    it("displays Google sign in button", () => {
      render(<SignInScreen />);
      expect(screen.getByText("Continue with Google")).toBeTruthy();
    });
  });
});
