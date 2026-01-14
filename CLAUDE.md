# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Little Journey is a baby milestone journal mobile app for the Singapore market. It enables parents to capture and preserve moments of their child's growth through photos, videos, and journal entries, with private family sharing.

**Platform Strategy:**
- Expo Mobile App (iOS + Android) for parents (this repo)
- Web Viewer (TanStack Start) for family members (planned)

## Commands

```bash
# Install dependencies
npm install

# Start development server
npm start              # or: npx expo start

# Run on specific platform
npm run ios            # iOS simulator
npm run android        # Android emulator
npm run web            # Web browser

# Linting
npm run lint           # Uses expo lint with ESLint flat config

# Reset to fresh project (moves app/ to app-example/)
npm run reset-project
```

## Architecture

### Tech Stack
- **Framework:** Expo SDK 54 (managed workflow)
- **Navigation:** Expo Router (file-based routing)
- **Styling:** React Native StyleSheet (NativeWind planned per PRD)
- **State:** TanStack Query planned for server state
- **UI:** React Native with expo-image for images, react-native-reanimated for animations

### Key Configurations
- **New Architecture enabled** (`newArchEnabled: true` in app.json)
- **React Compiler enabled** (`experiments.reactCompiler: true`)
- **Typed Routes enabled** (`experiments.typedRoutes: true`)
- **Strict TypeScript** enabled in tsconfig.json

### File Structure
```
app/                    # Expo Router screens (file-based routing)
  _layout.tsx          # Root layout with ThemeProvider
  (tabs)/              # Tab navigator group
    _layout.tsx        # Tab bar configuration
    index.tsx          # Home tab
    explore.tsx        # Explore tab
  modal.tsx            # Modal screen

components/            # Reusable UI components
  themed-text.tsx      # Theme-aware Text with type variants
  themed-view.tsx      # Theme-aware View
  parallax-scroll-view.tsx  # Animated scroll with parallax header
  ui/                  # Platform-specific components
    icon-symbol.tsx    # SF Symbols (iOS) / MaterialIcons (Android)

constants/
  theme.ts             # Colors and Fonts with light/dark mode

hooks/
  use-color-scheme.ts  # Platform color scheme detection
  use-theme-color.ts   # Get theme-aware colors
```

### Path Aliases
Use `@/*` to import from project root:
```typescript
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
```

### Theming System
- `Colors` object in `constants/theme.ts` defines light/dark color palettes
- `useColorScheme()` hook detects system preference
- `useThemeColor()` hook resolves colors based on current scheme
- Components accept `lightColor`/`darkColor` props for overrides

### Component Conventions
- File naming: kebab-case (e.g., `themed-text.tsx`)
- Platform-specific: `.ios.tsx` / `.android.tsx` suffixes
- ThemedText has type variants: `default`, `title`, `subtitle`, `defaultSemiBold`, `link`
