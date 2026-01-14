import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import AddChildScreen from "@/app/(onboarding)/add-child";
import { ChildProvider } from "@/contexts/child-context";

// Mock expo-router
const mockRouter = {
  push: jest.fn(),
};
jest.mock("expo-router", () => ({
  router: mockRouter,
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

const renderWithProviders = (component: React.ReactElement) => {
  return render(<ChildProvider>{component}</ChildProvider>);
};

describe("AddChildScreen - Photo Picker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
