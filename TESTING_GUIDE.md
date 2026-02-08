# Little Journey - Testing Guide

## Overview

This guide provides comprehensive testing strategies and test cases for the Little Journey app to achieve >80% test coverage.

---

## 📊 Test Coverage Goals

| Category | Target Coverage | Current |
|----------|----------------|---------|
| Components | 85% | 🔄 In Progress |
| Hooks | 80% | 🔄 In Progress |
| Utils | 90% | 🔄 In Progress |
| Integration | 75% | 🔄 In Progress |
| E2E | Critical Paths | 🔄 In Progress |

---

## 🧪 Test Structure

```
__tests__/
├── components/           # Component unit tests
│   ├── button.test.tsx
│   ├── card.test.tsx
│   ├── themed-text.test.tsx
│   ├── skeleton.test.tsx
│   └── ...
├── hooks/                # Hook tests
│   ├── use-auth.test.ts
│   ├── use-entries.test.ts
│   └── ...
├── utils/                # Utility function tests
│   ├── haptics.test.ts
│   ├── animations.test.ts
│   ├── validation.test.ts
│   └── ...
├── integration/          # Integration tests
│   ├── auth-flow.test.tsx
│   ├── entry-flow.test.tsx
│   └── ...
└── e2e/                  # End-to-end tests
    └── critical-paths.test.ts
```

---

## ✅ Test Categories

### 1. Unit Tests - Components

#### Button Component (`__tests__/components/button.test.tsx`)
- ✅ Rendering all variants (primary, secondary, ghost, danger)
- ✅ Rendering all sizes (sm, md, lg)
- ✅ Loading state
- ✅ Disabled state
- ✅ Icon support (left/right)
- ✅ onPress handler
- ✅ Haptic feedback
- ✅ Accessibility props

#### Card Component (`__tests__/components/card.test.tsx`)
- ✅ Rendering all variants (default, elevated, outlined, highlighted)
- ✅ Custom padding
- ✅ Entrance animation
- ✅ onPress handler
- ✅ CardHeader and CardFooter subcomponents
- ✅ Accessibility

#### ThemedText Component (`__tests__/components/themed-text.test.tsx`)
- ✅ All typography types (hero, heading, body, caption, label, etc.)
- ✅ Custom styling
- ✅ Light/dark color support
- ✅ Accessibility features

#### Skeleton Component (`__tests__/components/skeleton.test.tsx`)
- ✅ Base Skeleton with various props
- ✅ SkeletonText with line configuration
- ✅ SkeletonAvatar with size
- ✅ SkeletonCard composition
- ✅ SkeletonFeed with count

### 2. Unit Tests - Hooks

#### useAuth Hook
- Authentication state management
- Login/logout flow
- Token refresh
- Error handling

#### useEntries Hook
- Entry creation
- Entry fetching
- Pagination
- Caching

### 3. Unit Tests - Utils

#### Haptics (`__tests__/utils/haptics.test.ts`)
- ✅ Enable/disable configuration
- ✅ All impact types (light, medium, heavy)
- ✅ All notification types (success, warning, error)
- ✅ Selection feedback
- ✅ All predefined patterns

#### Animations (`__tests__/utils/animations.test.ts`)
- ✅ Spring configs (snappy, bouncy, gentle)
- ✅ Timing configs (fast, normal, slow, entrance)
- ✅ Button animations
- ✅ Card animations
- ✅ Stagger calculations
- ✅ Entering/Exiting animations

#### Validation (`__tests__/utils/validation.test.ts`)
- ✅ Email validation
- ✅ Date validation
- ✅ String validation
- ✅ Number validation
- ✅ Password validation
- ✅ Phone validation

### 4. Integration Tests

#### Auth Flow (`__tests__/integration/auth-flow.test.tsx`)
- Sign in screen rendering
- Email validation
- OAuth buttons (Google, Apple)
- Loading states
- Error handling
- Accessibility

#### Entry Flow
- Create entry flow
- Photo/video upload
- Caption editing
- Date selection
- Tag management

#### Milestone Flow
- Create milestone
- Complete milestone
- First words milestone
- Custom milestone

### 5. E2E Tests (Maestro/Detox)

#### Critical User Paths
1. **Onboarding Flow**
   - Sign up → Add child → Select culture → Set prompt time

2. **Create Entry Flow**
   - Tap FAB → Select type → Add media → Add caption → Post

3. **Complete Milestone**
   - View milestones → Select milestone → Complete → Celebrate

4. **Share with Family**
   - Invite family → Send link → Family views feed

---

## 🎯 Running Tests

### Run All Tests
```bash
npm test
```

### Run with Coverage
```bash
npm test -- --coverage
```

### Run Specific Test File
```bash
npm test -- __tests__/components/button.test.tsx
```

### Run in Watch Mode
```bash
npm test -- --watch
```

### Update Snapshots
```bash
npm test -- --updateSnapshot
```

---

## 📈 Coverage Report

Generate coverage report:
```bash
npm test -- --coverage --coverageReporters="text-summary"
```

View detailed HTML report:
```bash
npm test -- --coverage
coverage/lcov-report/index.html
```

---

## 🔧 Test Configuration

### Jest Setup (`jest.setup.js`)
- Expo modules mocked
- Native modules mocked
- Global fetch mock
- Console suppression

### Jest Config (`package.json`)
```json
{
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterEnv": ["./jest.setup.js"],
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)"
    ],
    "collectCoverageFrom": [
      "app/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
      "hooks/**/*.{ts,tsx}",
      "utils/**/*.{ts,tsx}",
      "!**/*.d.ts"
    ]
  }
}
```

---

## 🎭 Mocking Strategy

### External Dependencies
- `expo-haptics` - Mock all feedback functions
- `expo-router` - Mock navigation hooks
- `expo-image-picker` - Mock permission and selection
- `@tanstack/react-query` - Mock useQuery/useMutation
- `react-native-reanimated` - Use mock library

### Internal Modules
- Auth context - Mock user state
- API clients - Mock fetch responses
- Storage - Mock secure store operations

---

## 🐛 Debugging Tests

### Debug Specific Test
```bash
npm test -- --verbose __tests__/components/button.test.tsx
```

### Debug with Console Logs
```javascript
it("should debug", () => {
  console.log("Debug output");
  // test code
});
```

### Breakpoint Debugging
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## ✅ Test Checklist

### Components
- [x] Button
- [x] Card
- [x] ThemedText
- [x] Skeleton
- [ ] Avatar
- [ ] Chip
- [ ] Input
- [ ] FAB
- [ ] ProgressBar
- [ ] EntryCard
- [ ] MilestoneCard

### Hooks
- [ ] useAuth
- [ ] useEntries
- [ ] useMilestones
- [ ] useChildren
- [ ] useNotifications
- [ ] useStorage

### Utils
- [x] Haptics
- [x] Animations
- [x] Validation
- [ ] Date formatting
- [ ] EXIF extraction

### Integration
- [x] Auth flow
- [ ] Entry flow
- [ ] Milestone flow
- [ ] Settings flow

### E2E
- [ ] Onboarding
- [ ] Create entry
- [ ] Complete milestone
- [ ] Share with family
- [ ] Offline mode

---

## 📚 Best Practices

### 1. Test Naming
```typescript
// Good
describe("Button", () => {
  it("calls onPress when pressed", () => {
    // test
  });
});

// Avoid
describe("Button tests", () => {
  it("test 1", () => {
    // test
  });
});
```

### 2. Test Structure
```typescript
describe("ComponentName", () => {
  describe("Rendering", () => {
    // rendering tests
  });

  describe("Interactions", () => {
    // interaction tests
  });

  describe("Accessibility", () => {
    // a11y tests
  });
});
```

### 3. Mock Cleanup
```typescript
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  cleanup();
});
```

### 4. Async Testing
```typescript
it("handles async operations", async () => {
  render(<Component />);
  
  await waitFor(() => {
    expect(screen.getByText("Loaded")).toBeTruthy();
  });
});
```

---

## 🚀 CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v2
```

---

## 📞 Support

For test-related questions:
1. Check existing tests for patterns
2. Refer to React Native Testing Library docs
3. Review Jest documentation
4. Ask in team chat

---

## 📝 Changelog

### 2024-02-08
- Initial test suite setup
- Component tests for Button, Card, ThemedText, Skeleton
- Utility tests for Haptics, Animations, Validation
- Integration tests for Auth flow
- Test infrastructure with mocks
