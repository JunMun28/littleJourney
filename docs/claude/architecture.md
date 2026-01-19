# Architecture

## Tech Stack

- **Framework:** Expo SDK 54 (managed workflow)
- **Navigation:** Expo Router (file-based routing)
- **Styling:** React Native StyleSheet (NativeWind planned)
- **State:** TanStack Query planned for server state
- **Images:** expo-image
- **Animations:** react-native-reanimated

## Platform Strategy

- Mobile app (this repo): iOS + Android for parents
- Web viewer (planned): TanStack Start for family members

## Route Groups

```
app/
  (auth)/       # Sign-in flow
  (onboarding)/ # First-time setup (add-child, select-culture, etc.)
  (tabs)/       # Main tab navigator (index, milestones, growth, time-capsule, settings)
  entry/[id]    # Journal entry detail
  memory/[id]   # Memory detail
  capsule/[id]  # Time capsule detail
```

## Key Configurations

Defined in `app.json`:

- `newArchEnabled: true`
- `experiments.reactCompiler: true`
- `experiments.typedRoutes: true`
