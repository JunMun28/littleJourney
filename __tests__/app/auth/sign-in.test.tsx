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

// Mock expo-auth-session
jest.mock("expo-auth-session", () => ({
  makeRedirectUri: jest.fn(() => "littlejourney://oauth"),
}));

// Mock expo-auth-session/providers/google
const mockGoogleSignIn = jest.fn();
jest.mock("expo-auth-session/providers/google", () => ({
  useAuthRequest: jest.fn(() => [null, null, mockGoogleSignIn]),
}));

// Mock expo-web-browser
jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

// Mock expo-apple-authentication
jest.mock("expo-apple-authentication", () => ({
  signInAsync: jest.fn(),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  AppleAuthenticationScope: {
    FULL_NAME: 0,
    EMAIL: 1,
  },
}));

// Mock expo-linking for magic link deep linking
jest.mock("expo-linking", () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  getInitialURL: jest.fn().mockResolvedValue(null),
  parse: jest.fn((url: string) => ({
    queryParams: {},
  })),
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

  it("renders Apple Sign-In button when available", async () => {
    renderSignIn();
    await waitFor(() => {
      expect(screen.getByText("Continue with Apple")).toBeTruthy();
    });
  });
});
