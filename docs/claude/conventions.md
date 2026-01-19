# Conventions

## Imports

Use `@/*` alias for project root:

```typescript
import { ThemedText } from "@/components/themed-text";
```

## Theming

- Colors defined in `constants/theme.ts` (light/dark palettes)
- `useColorScheme()` - detects system preference
- `useThemeColor()` - resolves color for current scheme
- Components accept `lightColor`/`darkColor` props for overrides

## Component Files

- Located in `components/`
- Platform variants: `*.ios.tsx`, `*.android.tsx`
- UI primitives in `components/ui/`
