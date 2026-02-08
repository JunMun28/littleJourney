import "@testing-library/react-native/build/matchers/extend-expect";

// Mock expo-font
jest.mock("expo-font", () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));

// Mock expo-splash-screen
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

// Mock expo-haptics
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy",
  },
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
}));

// Mock react-native-safe-area-context
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
}));

// Mock @stripe/stripe-react-native
jest.mock("@stripe/stripe-react-native", () => ({
  initStripe: jest.fn().mockResolvedValue(undefined),
  useStripe: () => ({
    initPaymentSheet: jest.fn().mockResolvedValue({ error: null }),
    presentPaymentSheet: jest.fn().mockResolvedValue({ error: null }),
  }),
  StripeProvider: ({ children }) => children,
}));

// Mock expo-router
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  Link: ({ children }) => children,
}));

// Mock expo-router/stack
jest.mock("expo-router/stack", () => ({
  Stack: ({ children }) => children,
}));

// Mock expo-router/unstable-native-tabs
jest.mock("expo-router/unstable-native-tabs", () => ({
  NativeTabs: ({ children }) => children,
  NativeTabsTrigger: ({ children }) => children,
  Icon: () => null,
  Label: ({ children }) => children,
  Badge: ({ children }) => children,
}));

// Mock expo-image
jest.mock("expo-image", () => ({
  Image: ({ source, ...props }) => <img src={source?.uri} {...props} />,
}));

// Mock expo-image-picker
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: [] })),
  launchCameraAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: [] })),
  MediaTypeOptions: {
    Images: "Images",
    Videos: "Videos",
    All: "All",
  },
}));

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-notifications
jest.mock("expo-notifications", () => ({
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve("notification-id")),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  removeNotificationSubscription: jest.fn(),
}));

// Mock expo-device
jest.mock("expo-device", () => ({
  isDevice: true,
  brand: "Apple",
  manufacturer: "Apple",
  modelName: "iPhone 14",
  osName: "iOS",
  osVersion: "16.0",
}));

// Mock expo-linear-gradient
jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }) => children,
}));

// Mock expo-blur
jest.mock("expo-blur", () => ({
  BlurView: ({ children }) => children,
}));

// Mock @react-native-async-storage/async-storage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock @react-native-community/datetimepicker
jest.mock("@react-native-community/datetimepicker", () => {
  return jest.fn(() => null);
});

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.createAnimatedComponent = (component) => component;
  return Reanimated;
});

// Mock expo-av
jest.mock("expo-av", () => ({
  Video: () => null,
  Audio: {
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
  },
}));

// Mock @sentry/react-native
jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  configureScope: jest.fn(),
  ReactNativeTracing: jest.fn(),
}));

// Mock posthog-react-native
jest.mock("posthog-react-native", () => ({
  PostHogProvider: ({ children }) => children,
  usePostHog: () => ({
    capture: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
    screen: jest.fn(),
  }),
}));

// Mock @tanstack/react-query
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: jest.fn(),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: false,
  })),
  useInfiniteQuery: jest.fn(),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
  QueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
  QueryClientProvider: ({ children }) => children,
  dehydrate: jest.fn(),
  HydrationBoundary: ({ children }) => children,
}));

// Mock expo-auth-session
jest.mock("expo-auth-session", () => ({
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
  makeRedirectUri: jest.fn(() => "littlejourney://redirect"),
  ResponseType: {
    Token: "token",
  },
}));

// Mock expo-apple-authentication
jest.mock("expo-apple-authentication", () => ({
  signInAsync: jest.fn(() => Promise.resolve({
    identityToken: "mock-token",
    user: "mock-user-id",
    email: "test@example.com",
    fullName: { givenName: "Test", familyName: "User" },
  })),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  AppleAuthenticationButton: ({ onPress }) => (
    <button onClick={onPress}>Sign in with Apple</button>
  ),
  AppleAuthenticationButtonStyle: {
    BLACK: 0,
    WHITE: 1,
    WHITE_OUTLINE: 2,
  },
  AppleAuthenticationButtonType: {
    SIGN_IN: 0,
    CONTINUE: 1,
  },
}));

// Mock expo-crypto
jest.mock("expo-crypto", () => ({
  digestStringAsync: jest.fn(() => Promise.resolve("mock-digest")),
  CryptoDigestAlgorithm: {
    SHA256: "SHA-256",
  },
}));

// Mock expo-web-browser
jest.mock("expo-web-browser", () => ({
  openAuthSessionAsync: jest.fn(() => Promise.resolve({ type: "success" })),
  maybeCompleteAuthSession: jest.fn(),
}));

// Global fetch mock
global.fetch = jest.fn();

// Setup fetch mock
global.fetch.mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    status: 200,
    statusText: "OK",
  })
);

// Console error suppression for expected errors
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock Platform - must be before other imports
Object.defineProperty(global, "Platform", {
  value: {
    OS: "ios",
    select: jest.fn((obj) => obj.ios || obj.default),
    Version: "16.0",
  },
  writable: true,
});
