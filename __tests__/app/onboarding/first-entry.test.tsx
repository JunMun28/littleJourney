import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import FirstEntryScreen from "@/app/(onboarding)/first-entry";
import { AuthProvider } from "@/contexts/auth-context";

// Mock expo-router
const mockRouter = {
  replace: jest.fn(),
};
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
}));

// Mock expo-image-picker
const mockRequestMediaLibraryPermissionsAsync = jest.fn();
const mockLaunchImageLibraryAsync = jest.fn();
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: () =>
    mockRequestMediaLibraryPermissionsAsync(),
  launchImageLibraryAsync: () => mockLaunchImageLibraryAsync(),
  MediaTypeOptions: {
    All: "All",
  },
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe("FirstEntryScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: "granted",
    });
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: true,
    });
  });

  it("renders the screen title and description", () => {
    renderWithProviders(<FirstEntryScreen />);

    expect(screen.getByText("Add Your First Moment!")).toBeTruthy();
    expect(
      screen.getByText(/Start your baby's journal with a photo or video/),
    ).toBeTruthy();
  });

  it("renders the add photo button", () => {
    renderWithProviders(<FirstEntryScreen />);

    expect(screen.getByTestId("add-photo-button")).toBeTruthy();
  });

  it("renders the skip button", () => {
    renderWithProviders(<FirstEntryScreen />);

    expect(screen.getByTestId("skip-button")).toBeTruthy();
  });

  it("requests media library permission when add photo is pressed", async () => {
    renderWithProviders(<FirstEntryScreen />);

    const addButton = screen.getByTestId("add-photo-button");
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(mockRequestMediaLibraryPermissionsAsync).toHaveBeenCalled();
    });
  });

  it("launches image picker after permission granted", async () => {
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: "granted",
    });

    renderWithProviders(<FirstEntryScreen />);

    const addButton = screen.getByTestId("add-photo-button");
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(mockLaunchImageLibraryAsync).toHaveBeenCalled();
    });
  });
});
