import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AddChildScreen from "@/app/(onboarding)/add-child";
import { clearAllMockData, childApi } from "@/services/api-client";

// Mock expo-router
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  router: {
    push: (path: string) => mockPush(path),
  },
}));

// Mock expo-image-picker
const mockRequestMediaLibraryPermissionsAsync = jest.fn();
const mockLaunchImageLibraryAsync = jest.fn();
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: () =>
    mockRequestMediaLibraryPermissionsAsync(),
  launchImageLibraryAsync: () => mockLaunchImageLibraryAsync(),
  MediaTypeOptions: {
    Images: "Images",
  },
}));

// Create fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
  );
};

describe("AddChildScreen - Photo Picker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAllMockData();
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: "granted",
    });
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: true,
    });
  });

  it("renders the add photo button", () => {
    renderWithProviders(<AddChildScreen />);

    expect(screen.getByTestId("photo-button")).toBeTruthy();
  });

  it("shows placeholder icon when no photo selected", () => {
    renderWithProviders(<AddChildScreen />);

    expect(screen.getByTestId("photo-placeholder")).toBeTruthy();
  });

  it("requests media library permission when photo button is pressed", async () => {
    renderWithProviders(<AddChildScreen />);

    const photoButton = screen.getByTestId("photo-button");
    fireEvent.press(photoButton);

    await waitFor(() => {
      expect(mockRequestMediaLibraryPermissionsAsync).toHaveBeenCalled();
    });
  });

  it("launches image picker after permission granted", async () => {
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: "granted",
    });

    renderWithProviders(<AddChildScreen />);

    const photoButton = screen.getByTestId("photo-button");
    fireEvent.press(photoButton);

    await waitFor(() => {
      expect(mockLaunchImageLibraryAsync).toHaveBeenCalled();
    });
  });

  it("displays selected photo when picker returns image", async () => {
    const mockImageUri = "file:///test/photo.jpg";
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: mockImageUri }],
    });

    renderWithProviders(<AddChildScreen />);

    const photoButton = screen.getByTestId("photo-button");
    fireEvent.press(photoButton);

    await waitFor(() => {
      expect(screen.getByTestId("photo-preview")).toBeTruthy();
    });
  });
});

describe("AddChildScreen - TanStack Query Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAllMockData();
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: "granted",
    });
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: true });
  });

  it("creates child via API when form is submitted", async () => {
    renderWithProviders(<AddChildScreen />);

    // Fill in form
    const nameInput = screen.getByTestId("name-input");
    fireEvent.changeText(nameInput, "Test Baby");

    const dobButton = screen.getByTestId("dob-button");
    fireEvent.press(dobButton);

    // Simulate date selection
    const datePicker = screen.getByTestId("date-picker");
    fireEvent(datePicker, "onChange", {
      type: "set",
      nativeEvent: { timestamp: new Date("2024-01-15").getTime() },
    });

    // Submit form
    const continueButton = screen.getByTestId("continue-button");
    fireEvent.press(continueButton);

    // Wait for mutation to complete and navigation
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/(onboarding)/select-culture");
    });

    // Verify child was created in mock API
    const result = await childApi.getChildren();
    if ("data" in result && result.data) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.name).toBe("Test Baby");
    }
  });

  it("disables continue button until form is valid", () => {
    renderWithProviders(<AddChildScreen />);

    const continueButton = screen.getByTestId("continue-button");
    expect(continueButton.props.accessibilityState?.disabled).toBe(true);
  });

  it("includes nickname when provided", async () => {
    renderWithProviders(<AddChildScreen />);

    // Fill in name
    const nameInput = screen.getByTestId("name-input");
    fireEvent.changeText(nameInput, "Baby Name");

    // Fill in nickname
    const nicknameInput = screen.getByTestId("nickname-input");
    fireEvent.changeText(nicknameInput, "Sweetie");

    // Set DOB
    const dobButton = screen.getByTestId("dob-button");
    fireEvent.press(dobButton);
    const datePicker = screen.getByTestId("date-picker");
    fireEvent(datePicker, "onChange", {
      type: "set",
      nativeEvent: { timestamp: new Date("2024-03-01").getTime() },
    });

    // Submit
    const continueButton = screen.getByTestId("continue-button");
    fireEvent.press(continueButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });

    // Verify nickname was saved
    const result = await childApi.getChildren();
    if ("data" in result && result.data) {
      expect(result.data[0]?.nickname).toBe("Sweetie");
    }
  });
});
