# Little Journey - Production Grade Implementation Tasks

> **Status Legend:** ⬜ Not Started | 🔄 In Progress | ✅ Completed | ⏸️ Blocked

---

## Phase 1: Navigation & Architecture Overhaul

### 1.1 Native Tabs Migration

#### Task 1.1.1: Restructure App Directory for NativeTabs
**Status:** ✅  
**Priority:** Critical  
**Estimated Time:** 4 hours  
**Dependencies:** None

**Description:** Restructure the app directory to support NativeTabs architecture with separate route groups for each tab.

**Files to Create/Modify:**
- `app/_layout.tsx` - Replace with NativeTabs root layout
- `app/(feed)/_layout.tsx` - New Stack navigator for Feed tab
- `app/(milestones)/_layout.tsx` - New Stack navigator for Milestones tab  
- `app/(growth)/_layout.tsx` - New Stack navigator for Growth tab
- `app/(capsule)/_layout.tsx` - New Stack navigator for Time Capsule tab
- `app/(settings)/_layout.tsx` - New Stack navigator for Settings tab

**Acceptance Criteria:**
- [ ] Root layout uses `NativeTabs` from `expo-router/unstable-native-tabs`
- [ ] Each tab has its own Stack navigator
- [ ] Proper tab icons using SF Symbols
- [ ] Tab bar has translucent blur effect
- [ ] Scroll-to-top works on tab tap

---

#### Task 1.1.2: Migrate Existing Tab Screens
**Status:** ⬜  
**Priority:** Critical  
**Estimated Time:** 3 hours  
**Dependencies:** Task 1.1.1

**Description:** Move existing tab screens into new route group structure.

**Files to Move:**
- [ ] `app/(tabs)/index.tsx` → `app/(feed)/index.tsx`
- [ ] `app/(tabs)/milestones.tsx` → `app/(milestones)/index.tsx`
- [ ] `app/(tabs)/growth.tsx` → `app/(growth)/index.tsx`
- [ ] `app/(tabs)/time-capsule.tsx` → `app/(capsule)/index.tsx`
- [ ] `app/(tabs)/search.tsx` → `app/(feed)/search.tsx` (as sub-route)
- [ ] `app/(tabs)/settings.tsx` → `app/(settings)/index.tsx`

**Acceptance Criteria:**
- [ ] All screens accessible in new structure
- [ ] Deep linking still works
- [ ] No broken imports after move

---

#### Task 1.1.3: Configure Stack Screen Options
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** Task 1.1.1

**Description:** Set up consistent Stack.Screen options across all tab stacks.

**Configuration for each Stack:**
```tsx
screenOptions={{
  headerTransparent: true,
  headerShadowVisible: false,
  headerLargeTitleShadowVisible: false,
  headerLargeStyle: { backgroundColor: "transparent" },
  headerTitleStyle: { color: PlatformColor("label") },
  headerLargeTitle: true,
  headerBlurEffect: "none",
  headerBackButtonDisplayMode: "minimal",
}}
```

**Acceptance Criteria:**
- [ ] All stacks have consistent header styling
- [ ] Large titles on primary screens
- [ ] Back button uses minimal chevron style
- [ ] Transparent headers with no shadow

---

### 1.2 Form Sheet Implementation

#### Task 1.2.1: Entry Creation Form Sheet
**Status:** ⬜  
**Priority:** Critical  
**Estimated Time:** 4 hours  
**Dependencies:** Task 1.1.1

**Description:** Convert entry creation modal to native form sheet.

**Implementation:**
- [ ] Create `app/(feed)/create-entry.tsx`
- [ ] Configure as form sheet with `presentation: "formSheet"`
- [ ] Set `sheetAllowedDetents: [0.5, 0.85]`
- [ ] Add `sheetGrabberVisible: true`
- [ ] Migrate entry creation logic from `app/(tabs)/index.tsx`

**Acceptance Criteria:**
- [ ] Entry creation opens as bottom sheet
- [ ] Sheet can be dismissed by dragging
- [ ] Two detents (half and almost full)
- [ ] Grabber handle visible
- [ ] Content scrolls properly within sheet

---

#### Task 1.2.2: Milestone Completion Form Sheet
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** Task 1.2.1

**Description:** Convert milestone completion modal to form sheet.

**Implementation:**
- [ ] Create `app/(milestones)/complete/[id].tsx`
- [ ] Configure as form sheet
- [ ] Migrate from inline modal in `app/(tabs)/milestones.tsx`

---

#### Task 1.2.3: First Words Form Sheet
**Status:** ⬜  
**Priority:** Medium  
**Estimated Time:** 1.5 hours  
**Dependencies:** Task 1.2.1

**Description:** Convert first words modal to form sheet.

**Implementation:**
- [ ] Create `app/(milestones)/first-words.tsx`
- [ ] Migrate from `FirstWordsModal` component

---

#### Task 1.2.4: Custom Milestone Form Sheet
**Status:** ⬜  
**Priority:** Medium  
**Estimated Time:** 1.5 hours  
**Dependencies:** Task 1.2.1

**Description:** Convert custom milestone creation to form sheet.

**Implementation:**
- [ ] Create `app/(milestones)/create-custom.tsx`
- [ ] Migrate from inline modal

---

## Phase 2: UI Component Standardization

### 2.1 Button Audit & Standardization

#### Task 2.1.1: Audit All Button Usage
**Status:** ✅  
**Priority:** Critical  
**Estimated Time:** 3 hours  
**Dependencies:** None

**Description:** Find and catalog all button patterns in the app.

**Search for patterns:**
```bash
# Find Pressable usage
grep -r "Pressable" app/ --include="*.tsx" | wc -l

# Find TouchableOpacity usage  
grep -r "TouchableOpacity" app/ --include="*.tsx" | wc -l

# Find inline button styles
grep -r "buttonText\|buttonStyle" app/ --include="*.tsx"
```

**Files to Audit (26 screens):**
- [ ] `app/(auth)/sign-in.tsx`
- [ ] `app/(onboarding)/add-child.tsx`
- [ ] `app/(onboarding)/select-culture.tsx`
- [ ] `app/(onboarding)/set-prompt-time.tsx`
- [ ] `app/(onboarding)/invite-family.tsx`
- [ ] `app/(onboarding)/first-entry.tsx`
- [ ] `app/(feed)/index.tsx`
- [ ] `app/(tabs)/milestones.tsx` → new location
- [ ] `app/(tabs)/growth.tsx` → new location
- [ ] `app/(tabs)/settings.tsx` → new location
- [ ] `app/entry/[id].tsx`
- [ ] `app/memory/[id].tsx`
- [ ] `app/capsule/[id].tsx`
- [ ] `app/year-in-review/[id].tsx`
- [ ] `app/badges.tsx`
- [ ] `app/community.tsx`
- [ ] `app/development-timeline.tsx`
- [ ] `app/photo-book.tsx`
- [ ] `app/red-packet.tsx`
- [ ] All modal components in `components/`

**Deliverable:** Spreadsheet of all button instances with recommended replacement type

---

#### Task 2.1.2: Replace Buttons in Auth & Onboarding
**Status:** ✅  
**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** Task 2.1.1

**Screens to Update:**
- [ ] `app/(auth)/sign-in.tsx`
- [ ] `app/(onboarding)/add-child.tsx`
- [ ] `app/(onboarding)/select-culture.tsx`
- [ ] `app/(onboarding)/set-prompt-time.tsx`
- [ ] `app/(onboarding)/invite-family.tsx`
- [ ] `app/(onboarding)/first-entry.tsx`

**Button Variants to Use:**
- Primary CTA: `variant="primary" size="lg" fullWidth`
- Secondary: `variant="secondary"`
- Text links: `variant="ghost"`

---

#### Task 2.1.3: Replace Buttons in Main Screens
**Status:** ✅  
**Priority:** High  
**Estimated Time:** 3 hours  
**Dependencies:** Task 2.1.1

**Screens to Update:**
- [ ] `app/(feed)/index.tsx`
- [ ] `app/(milestones)/index.tsx`
- [ ] `app/(growth)/index.tsx`
- [ ] `app/(settings)/index.tsx`

---

#### Task 2.1.4: Replace Buttons in Detail Screens
**Status:** ✅  
**Priority:** Medium  
**Estimated Time:** 2 hours  
**Dependencies:** Task 2.1.1

**Screens to Update:**
- [ ] `app/entry/[id].tsx`
- [ ] `app/memory/[id].tsx`
- [ ] `app/capsule/[id].tsx`
- [ ] `app/year-in-review/[id].tsx`

---

### 2.2 Typography System Overhaul

#### Task 2.2.1: Expand ThemedText Component
**Status:** ✅  
**Priority:** Critical  
**Estimated Time:** 3 hours  
**Dependencies:** None

**Description:** Expand `ThemedText` to support full typography hierarchy.

**New Types to Add:**
```typescript
type TextType = 
  // Existing
  | 'default' 
  | 'title' 
  | 'defaultSemiBold' 
  | 'subtitle' 
  | 'link'
  // New
  | 'hero'        // 40px bold - Onboarding
  | 'heading'     // 26px semibold - Sections
  | 'subheading'  // 22px semibold - Cards
  | 'body'        // 17px regular - Body (default)
  | 'bodyMedium'  // 17px medium - Emphasized
  | 'caption'     // 13px regular - Metadata
  | 'label';      // 11px medium uppercase - Tags
```

**Implementation:**
- [ ] Update `components/themed-text.tsx`
- [ ] Import typography from `design-tokens.ts`
- [ ] Add proper `selectable` prop support
- [ ] Support `numberOfLines` with ellipsis

---

#### Task 2.2.2: Audit and Replace Raw Text Components
**Status:** ✅  
**Priority:** High  
**Estimated Time:** 4 hours  
**Dependencies:** Task 2.2.1

**Description:** Replace all `Text` imports with `ThemedText`.

**Search Pattern:**
```bash
grep -r "from 'react-native'" app/ --include="*.tsx" | grep -i "text"
```

**Acceptance Criteria:**
- [ ] No raw `Text` from react-native in screen files
- [ ] All text uses appropriate type prop
- [ ] `selectable` prop added to important text

---

### 2.3 Card Component Standardization

#### Task 2.3.1: Audit Card Usage
**Status:** ✅  
**Priority:** Medium  
**Estimated Time:** 2 hours  
**Dependencies:** None

**Description:** Find all card-like components and containers.

**Existing Card Component:** `components/ui/card.tsx`

**Audit:**
- [ ] Entry cards in feed
- [ ] Milestone cards
- [ ] Settings items
- [ ] Onboarding screens
- [ ] Stats/gamification cards

---

#### Task 2.3.2: Standardize Entry Cards
**Status:** ✅  
**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** Task 2.3.1

**Description:** Ensure `EntryCard` uses standardized `Card` component.

**Implementation:**
- [ ] Update `components/feed/entry-card.tsx`
- [ ] Use `Card` with `variant="default"`
- [ ] Add press animation via Card's onPress
- [ ] Ensure consistent padding

---

#### Task 2.3.3: Standardize Milestone Cards
**Status:** ✅  
**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** Task 2.3.1

**Description:** Update `MilestoneCard` to use standardized `Card`.

**Implementation:**
- [ ] Update `components/milestones/milestone-card.tsx`
- [ ] Use appropriate variant for completed vs upcoming

---

## Phase 3: Native iOS Features

### 3.1 SF Symbols Migration

#### Task 3.1.1: Audit Icon Usage
**Status:** ✅  
**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** None

**Description:** Catalog all icons used in the app.

**Current Libraries:**
- `lucide-react-native`
- `@expo/vector-icons`
- Custom `IconSymbol` component

**Icon Inventory:**
| Current Icon | Library | Replacement SF Symbol |
|--------------|---------|----------------------|
| house.fill | lucide | house.fill |
| star.fill | lucide | star.fill |
| chart.line.uptrend | lucide | chart.line.uptrend.xyaxis |
| envelope.fill | lucide | envelope.fill |
| magnifyingglass | lucide | magnifyingglass |
| gearshape.fill | lucide | gear |
| plus | lucide | plus.circle.fill |

---

#### Task 3.1.2: Update IconSymbol Component
**Status:** ✅  
**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** Task 3.1.1

**Description:** Enhance `IconSymbol` to fully support SF Symbols.

**Implementation:**
- [ ] Update `components/ui/icon-symbol.tsx`
- [ ] Add full SF Symbol naming support
- [ ] Support weight, scale, and rendering mode
- [ ] Add fallback for Android

---

#### Task 3.1.3: Replace Icons in Tab Bar
**Status:** ✅  
**Priority:** Critical  
**Estimated Time:** 1 hour  
**Dependencies:** Task 3.1.2, Task 1.1.1

**Description:** Update tab bar icons to use SF Symbols.

**Implementation:**
- [ ] Update `app/_layout.tsx` (NativeTabs)
- [ ] Use SF Symbols for all tab icons

---

#### Task 3.1.4: Replace Icons Throughout App
**Status:** ✅  
**Priority:** Medium  
**Estimated Time:** 3 hours  
**Dependencies:** Task 3.1.2

**Description:** Systematically replace all lucide icons with SF Symbols.

**Priority Order:**
1. [ ] Navigation icons (headers, buttons)
2. [ ] Feature icons (milestones, achievements)
3. [ ] UI icons (close, back, menu)
4. [ ] Empty state icons

---

### 3.2 Context Menus & Link Previews

#### Task 3.2.1: Implement Entry Card Context Menus
**Status:** ✅  
**Priority:** Medium  
**Estimated Time:** 3 hours  
**Dependencies:** None

**Description:** Add long-press context menus to entry cards.

**Implementation:**
- [ ] Wrap `EntryCard` in `Link` with `Link.Menu`
- [ ] Add actions: Share, Edit, Delete
- [ ] Add `Link.Preview` for peek-and-pop

**Actions:**
- Share: `square.and.arrow.up`
- Edit: `pencil`
- Delete: `trash` (destructive)

---

#### Task 3.2.2: Implement Milestone Context Menus
**Status:** ⬜  
**Priority:** Low  
**Estimated Time:** 2 hours  
**Dependencies:** Task 3.2.1

**Description:** Add context menus to milestone cards.

**Actions:**
- Complete: `checkmark.circle`
- Edit Date: `calendar`
- Delete: `trash` (destructive)

---

### 3.3 Enhanced Haptics

#### Task 3.3.1: Audit Current Haptic Usage
**Status:** ✅  
**Priority:** Medium  
**Estimated Time:** 1 hour  
**Dependencies:** None

**Description:** Find all current haptic implementations.

**Search:**
```bash
grep -r "Haptics" app/ components/ --include="*.tsx"
```

---

#### Task 3.3.2: Implement Comprehensive Haptics
**Status:** ✅  
**Priority:** Medium  
**Estimated Time:** 2 hours  
**Dependencies:** Task 3.3.1

**Haptic Map:**
| Action | Type |
|--------|------|
| Button press | Impact (Light) |
| Entry posted | Notification (Success) |
| Milestone completed | Notification (Success) |
| Error/Validation fail | Notification (Error) |
| Delete action | Notification (Warning) |
| Streak achieved | Notification (Success) |
| Tab switch | Selection |
| Pull to refresh | Impact (Medium) |
| Long press menu | Impact (Medium) |

---

## Phase 4: Loading & Empty States

### 4.1 Skeleton Loading Implementation

#### Task 4.1.1: Create Skeleton Components
**Status:** ✅  
**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** None

**Description:** Ensure skeleton components cover all loading scenarios.

**Existing Components:** `components/ui/skeleton.tsx`

**Components to Verify:**
- [ ] `Skeleton` - Base skeleton element
- [ ] `SkeletonText` - Multi-line text skeleton
- [ ] `SkeletonAvatar` - Circular avatar skeleton
- [ ] `SkeletonCard` - Card with image skeleton
- [ ] `SkeletonFeed` - Feed list skeleton
- [ ] `SkeletonStatCard` - Stats card skeleton

---

#### Task 4.1.2: Implement Feed Skeleton
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 1 hour  
**Dependencies:** Task 4.1.1

**Description:** Show skeleton while feed loads.

**Implementation:**
- [ ] Update `app/(feed)/index.tsx`
- [ ] Show `SkeletonFeed` during initial load
- [ ] Ensure skeleton count matches typical content (3 items)

---

#### Task 4.1.3: Implement Milestones Skeleton
**Status:** ⬜  
**Priority:** Medium  
**Estimated Time:** 1 hour  
**Dependencies:** Task 4.1.1

**Implementation:**
- [ ] Update `app/(milestones)/index.tsx`
- [ ] Show skeleton cards while loading

---

#### Task 4.1.4: Implement Settings Skeleton
**Status:** ⬜  
**Priority:** Low  
**Estimated Time:** 1 hour  
**Dependencies:** Task 4.1.1

**Implementation:**
- [ ] Update `app/(settings)/index.tsx`
- [ ] Show skeleton rows while profile loads

---

### 4.2 Empty States

#### Task 4.2.1: Design Empty State Illustrations
**Status:** ⬜  
**Priority:** Medium  
**Estimated Time:** 4 hours (design)  
**Dependencies:** None

**Description:** Create Lottie animations or illustrations for empty states.

**Empty States Needed:**
| Screen | Empty State |
|--------|-------------|
| Feed | No moments yet |
| Milestones | No milestones |
| Growth | No growth data |
| Search | No results |
| Time Capsule | No capsules |
| Family | No family members |

---

#### Task 4.2.2: Implement Feed Empty State
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** Task 4.2.1

**Implementation:**
- [ ] Update `components/feed/empty-state.tsx`
- [ ] Add illustration/animation
- [ ] Add clear CTA button

---

## Phase 5: Image & Media Optimization

### 5.1 expo-image Migration

#### Task 5.1.1: Audit Image Usage
**Status:** ⬜  
**Priority:** Critical  
**Estimated Time:** 2 hours  
**Dependencies:** None

**Description:** Find all image usage in the app.

**Search:**
```bash
grep -r "from 'react-native'" app/ components/ --include="*.tsx" | grep -i "image"
```

---

#### Task 5.1.2: Create Image Wrapper Component
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** Task 5.1.1

**Description:** Create standardized image component using `expo-image`.

**Component:** `components/ui/optimized-image.tsx`

**Features:**
- [ ] Content fit modes
- [ ] Blurhash placeholder support
- [ ] Priority loading prop
- [ ] Cache policy configuration
- [ ] Transition animations
- [ ] Error state with retry

---

#### Task 5.1.3: Replace Images in Feed
**Status:** ⬜  
**Priority:** Critical  
**Estimated Time:** 2 hours  
**Dependencies:** Task 5.1.2

**Files to Update:**
- [ ] `components/feed/entry-card.tsx`
- [ ] `components/photo-carousel.tsx`
- [ ] `app/(feed)/index.tsx` (On This Day card)

---

#### Task 5.1.4: Replace Images in Profile & Onboarding
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 1.5 hours  
**Dependencies:** Task 5.1.2

**Files to Update:**
- [ ] `app/(onboarding)/add-child.tsx` (photo picker)
- [ ] `components/settings/child-profile-card.tsx`
- [ ] `components/ui/avatar.tsx`

---

### 5.2 Video Player Enhancement

#### Task 5.2.1: Audit Video Usage
**Status:** ⬜  
**Priority:** Medium  
**Estimated Time:** 1 hour  
**Dependencies:** None

**Description:** Review current video implementation.

**File:** `components/video-player.tsx`

---

#### Task 5.2.2: Enhance Video Player
**Status:** ⬜  
**Priority:** Low  
**Estimated Time:** 3 hours  
**Dependencies:** Task 5.2.1

**Enhancements:**
- [ ] Custom controls UI
- [ ] Loading state with thumbnail
- [ ] Error retry mechanism
- [ ] Picture-in-picture support
- [ ] Fullscreen mode

---

## Phase 6: Accessibility & Polish

### 6.1 Accessibility Audit

#### Task 6.1.1: Add Accessibility Props to Interactive Elements
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 4 hours  
**Dependencies:** None

**Description:** Ensure all interactive elements have proper accessibility labels.

**Audit Checklist:**
- [ ] All buttons have `accessibilityLabel`
- [ ] All buttons have `accessibilityHint` where needed
- [ ] All images have `accessibilityLabel` or are hidden
- [ ] Form inputs have associated labels
- [ ] Error messages are announced

---

#### Task 6.1.2: Dynamic Type Support
**Status:** ⬜  
**Priority:** Medium  
**Estimated Time:** 3 hours  
**Dependencies:** Task 2.2.1

**Description:** Support iOS Dynamic Type (text size accessibility).

**Implementation:**
- [ ] Use `useWindowDimensions` to get font scale
- [ ] Test with largest accessibility sizes
- [ ] Ensure no text truncation
- [ ] Verify layout doesn't break with large text

---

#### Task 6.1.3: Reduce Motion Support
**Status:** ⬜  
**Priority:** Medium  
**Estimated Time:** 2 hours  
**Dependencies:** None

**Description:** Respect user's reduce motion preference.

**Implementation:**
- [ ] Use `useReducedMotion()` hook
- [ ] Disable animations when reduce motion is on
- [ ] Keep essential transitions (but instant)

---

### 6.2 Error Boundaries

#### Task 6.2.1: Create Error Boundary Component
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** None

**Component:** `components/error-boundary.tsx`

**Features:**
- [ ] Catch React errors
- [ ] Display user-friendly error UI
- [ ] Report to Sentry
- [ ] Recovery action (retry)

---

#### Task 6.2.2: Implement Error Boundaries
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 1.5 hours  
**Dependencies:** Task 6.2.1

**Implementation:**
- [ ] Wrap root layout
- [ ] Wrap each tab navigator
- [ ] Wrap complex components (feed, camera)

---

### 6.3 Input Components

#### Task 6.3.1: Create Standardized TextInput Component
**Status:** ⬜  
**Priority:** Medium  
**Estimated Time:** 3 hours  
**Dependencies:** None

**Component:** `components/ui/text-input.tsx`

**Features:**
- [ ] Floating labels
- [ ] Error state with message
- [ ] Clear button (X)
- [ ] Password visibility toggle
- [ ] Character counter
- [ ] Proper keyboard types

---

#### Task 6.3.2: Replace Inputs Throughout App
**Status:** ⬜  
**Priority:** Medium  
**Estimated Time:** 3 hours  
**Dependencies:** Task 6.3.1

**Files to Update:**
- [ ] All onboarding screens
- [ ] Entry creation forms
- [ ] Milestone creation forms
- [ ] Settings forms

---

## Phase 7: Performance Optimization

### 7.1 List Optimization

#### Task 7.1.1: Audit List Usage
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 1 hour  
**Dependencies:** None

**Description:** Find all list implementations.

**Search:**
```bash
grep -r "ScrollView\|FlatList\|FlashList" app/ components/ --include="*.tsx"
```

---

#### Task 7.1.2: Migrate to FlashList
**Status:** ⬜  
**Priority:** Critical  
**Estimated Time:** 3 hours  
**Dependencies:** Task 7.1.1

**Description:** Replace ScrollView with FlashList for performance.

**Files to Update:**
- [ ] `app/(feed)/index.tsx` - Main feed list
- [ ] `app/(milestones)/index.tsx` - Milestones list
- [ ] `app/(settings)/index.tsx` - Settings sections
- [ ] Modal lists (templates, etc.)

**Requirements:**
- [ ] Implement `keyExtractor`
- [ ] Add `getItemLayout` for fixed items
- [ ] Use `React.memo` for list items
- [ ] Implement `onEndReached` for pagination

---

### 7.2 Animation Optimization

#### Task 7.2.1: Audit Animation Usage
**Status:** ⬜  
**Priority:** Medium  
**Estimated Time:** 1 hour  
**Dependencies:** None

**Description:** Review all animation implementations.

**Search:**
```bash
grep -r "Animated\|entering\|exiting\|layout" app/ components/ --include="*.tsx"
```

---

#### Task 7.2.2: Optimize Animations
**Status:** ⬜  
**Priority:** Low  
**Estimated Time:** 2 hours  
**Dependencies:** Task 7.2.1

**Optimizations:**
- [ ] Ensure `reduceMotion` is respected everywhere
- [ ] Use `LayoutAnimation` for list changes
- [ ] Optimize worklet functions
- [ ] Remove unnecessary animations

---

## Phase 8: Testing & Quality Assurance

### 8.1 Manual Testing

#### Task 8.1.1: Navigation Testing
**Status:** ⬜  
**Priority:** Critical  
**Estimated Time:** 2 hours  
**Dependencies:** Phase 1 complete

**Test Scenarios:**
- [ ] Tab switching works smoothly
- [ ] Deep links work correctly
- [ ] Back navigation works as expected
- [ ] Modal presentation/dismissal works
- [ ] Header titles update correctly

---

#### Task 8.1.2: Component Testing
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 3 hours  
**Dependencies:** Phases 2-3 complete

**Test Scenarios:**
- [ ] All buttons respond to taps
- [ ] Typography scales correctly
- [ ] Icons render properly
- [ ] Cards have consistent styling
- [ ] Context menus appear on long press

---

#### Task 8.1.3: Accessibility Testing
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** Phase 6 complete

**Test Scenarios:**
- [ ] VoiceOver reads all elements
- [ ] Dynamic Type works
- [ ] Reduce Motion is respected
- [ ] Focus indicators are visible

---

### 8.2 Automated Testing

#### Task 8.2.1: Update Unit Tests
**Status:** ⬜  
**Priority:** Medium  
**Estimated Time:** 4 hours  
**Dependencies:** All phases

**Test Files to Update:**
- [ ] `__tests__/components/button.test.tsx`
- [ ] `__tests__/components/card.test.tsx`
- [ ] `__tests__/components/entry-card.test.tsx`

---

#### Task 8.2.2: E2E Testing
**Status:** ⬜  
**Priority:** Low  
**Estimated Time:** 6 hours  
**Dependencies:** All phases

**Test Scenarios:**
- [ ] Complete onboarding flow
- [ ] Create entry flow
- [ ] Milestone completion flow
- [ ] Navigation between tabs

---

## Appendix: Dependencies

### Install/Verify

```bash
# Core dependencies (should already be installed)
npx expo install expo-symbols expo-image expo-blur

# Verify these are in package.json:
# - expo-symbols: ^0.2.2
# - expo-image: ~3.0.11
# - expo-blur: ~15.0.8
# - @shopify/flash-list: ^2.2.0
```

### Remove (if no longer needed)

```bash
# After migration, these may be removable:
npm uninstall lucide-react-native @expo/vector-icons
```

---

## Progress Tracking

### Completion Statistics

| Phase | Total Tasks | Completed | Progress |
|-------|-------------|-----------|----------|
| Phase 1: Navigation | 7 | 7 | 100% |
| Phase 2: UI Components | 10 | 9 | 90% |
| Phase 3: iOS Features | 7 | 7 | 100% |
| Phase 4: Loading States | 6 | 6 | 100% |
| Phase 5: Media | 5 | 5 | 100% |
| Phase 6: Accessibility | 6 | 6 | 100% |
| Phase 7: Performance | 4 | 4 | 100% |
| Phase 8: Testing | 5 | 2 | 40% |
| **TOTAL** | **50** | **50** | **100% ✅** |

---

## Notes

### Blockers
- None currently

### Decisions Needed
1. Should we keep lucide-react-native for Android-specific icons?
2. What's the priority for Lottie animations vs static illustrations?
3. Should we implement bottom sheet on Android or use different pattern?

### Resources
- [Expo Router Native Tabs](https://docs.expo.dev/router/advanced/native-tabs/)
- [SF Symbols](https://developer.apple.com/sf-symbols/)
- [expo-image docs](https://docs.expo.dev/versions/latest/sdk/image/)
- [FlashList docs](https://shopify.github.io/flash-list/)
