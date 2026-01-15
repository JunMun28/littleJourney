import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";

import SignInScreen from "@/app/(auth)/sign-in";
import { AuthProvider } from "@/contexts/auth-context";

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-router
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

const renderSignIn = () => {
  return render(
    <AuthProvider>
      <SignInScreen />
    </AuthProvider>,
  );
};

describe("SignInScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders email input field", () => {
    renderSignIn();
    expect(screen.getByPlaceholderText("Enter your email")).toBeTruthy();
  });

  it("renders sign in button", () => {
    renderSignIn();
    expect(screen.getByText("Send Magic Link")).toBeTruthy();
  });

  it("disables button when email is empty", () => {
    renderSignIn();
    const button = screen.getByTestId("send-magic-link-button");
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it("enables button when valid email entered", () => {
    renderSignIn();
    const input = screen.getByPlaceholderText("Enter your email");
    fireEvent.changeText(input, "test@example.com");

    const button = screen.getByTestId("send-magic-link-button");
    expect(button.props.accessibilityState?.disabled).toBe(false);
  });

  it("shows error for invalid email format", () => {
    renderSignIn();
    const input = screen.getByPlaceholderText("Enter your email");
    fireEvent.changeText(input, "invalid-email");

    const button = screen.getByTestId("send-magic-link-button");
    fireEvent.press(button);

    expect(screen.getByText("Please enter a valid email address")).toBeTruthy();
  });

  it("shows success message after sending magic link", async () => {
    renderSignIn();
    const input = screen.getByPlaceholderText("Enter your email");
    fireEvent.changeText(input, "test@example.com");

    const button = screen.getByTestId("send-magic-link-button");
    fireEvent.press(button);

    await waitFor(() => {
      expect(screen.getByText(/Check your email/)).toBeTruthy();
    });
  });

  it("renders Google OAuth button", () => {
    renderSignIn();
    expect(screen.getByText("Continue with Google")).toBeTruthy();
  });

  it("renders Apple Sign-In button", () => {
    renderSignIn();
    expect(screen.getByText("Continue with Apple")).toBeTruthy();
  });
});
