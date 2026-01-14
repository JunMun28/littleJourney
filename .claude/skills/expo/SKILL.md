---
name: expo
description: Build cross-platform Android, iOS, and web apps with Expo and React Native. Use this skill when working with Expo projects for creating new apps, configuring app.json/app.config.js, setting up Expo Router navigation, using EAS (Build/Submit/Update), managing development builds, configuring native modules, or troubleshooting Expo-specific issues. Triggers include mentions of Expo, React Native with Expo, Expo Router, EAS Build, EAS Submit, EAS Update, expo-dev-client, app.json configuration, or file-based routing in React Native.
---

# Expo Development Skill

Build universal apps for Android, iOS, and web using Expo framework and Expo Application Services (EAS).

## Quick Reference

### Create New Project
```bash
npx create-expo-app@latest my-app
cd my-app
npx expo start
```

### Core CLI Commands
```bash
npx expo start              # Start dev server
npx expo start --clear      # Clear cache and start
npx expo prebuild           # Generate native projects
npx expo prebuild --clean   # Regenerate native projects
npx expo run:ios            # Build and run iOS locally
npx expo run:android        # Build and run Android locally
npx expo install <package>  # Install compatible packages
```

### EAS CLI Commands
```bash
npx eas build --platform ios              # Build for iOS
npx eas build --platform android          # Build for Android
npx eas build --profile development       # Development build
npx eas build --profile preview           # Preview/test build
npx eas build --profile production        # Production build
npx eas submit --platform ios             # Submit to App Store
npx eas submit --platform android         # Submit to Play Store
npx eas update --channel production       # Push OTA update
```

## Project Structure

```
my-app/
├── app/                    # Expo Router pages (file-based routing)
│   ├── _layout.tsx         # Root layout (navigation setup)
│   ├── index.tsx           # Home screen (/)
│   ├── [id].tsx            # Dynamic route (/123)
│   └── (tabs)/             # Tab group
│       ├── _layout.tsx     # Tab navigator config
│       ├── index.tsx       # First tab
│       └── settings.tsx    # Second tab
├── assets/                 # Static assets (images, fonts)
├── components/             # Reusable components
├── app.json                # Static app configuration
├── app.config.js           # Dynamic app configuration (optional)
├── eas.json                # EAS Build/Submit configuration
├── package.json
└── tsconfig.json
```

## App Configuration (app.json)

Minimal configuration:
```json
{
  "expo": {
    "name": "My App",
    "slug": "my-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "bundleIdentifier": "com.company.myapp",
      "supportsTablet": true
    },
    "android": {
      "package": "com.company.myapp",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "bundler": "metro",
      "favicon": "./assets/favicon.png"
    },
    "plugins": []
  }
}
```

Dynamic configuration (app.config.js):
```javascript
module.exports = ({ config }) => ({
  ...config,
  name: process.env.APP_ENV === 'production' ? 'My App' : 'My App (Dev)',
  extra: {
    apiUrl: process.env.API_URL,
    eas: {
      projectId: "your-project-id"
    }
  }
});
```

## EAS Configuration (eas.json)

```json
{
  "cli": {
    "version": ">= 5.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "channel": "production",
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "your-app-store-connect-id"
      },
      "android": {
        "track": "internal"
      }
    }
  }
}
```

## Expo Router Patterns

### Root Layout (_layout.tsx)
```tsx
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <Stack />;
}
```

### Tab Navigation
```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#007AFF' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />
        }}
      />
    </Tabs>
  );
}
```

### Navigation Between Screens
```tsx
import { Link, useRouter } from 'expo-router';

// Declarative navigation
<Link href="/profile">Go to Profile</Link>
<Link href={{ pathname: '/user/[id]', params: { id: '123' } }}>User 123</Link>

// Programmatic navigation
const router = useRouter();
router.push('/profile');
router.replace('/home');
router.back();
```

### Dynamic Routes
```tsx
// app/user/[id].tsx
import { useLocalSearchParams } from 'expo-router';

export default function UserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Text>User ID: {id}</Text>;
}
```

### Authentication Pattern
```tsx
// app/_layout.tsx
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../context/auth';

export default function RootLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}

// app/(app)/_layout.tsx - Protected routes
export default function AppLayout() {
  const { user } = useAuth();
  if (!user) return <Redirect href="/login" />;
  return <Stack />;
}
```

## Development Builds

Development builds are custom Expo Go alternatives with full native access.

### Setup
```bash
npx expo install expo-dev-client
npx eas build --profile development --platform ios
npx eas build --profile development --platform android
```

### When to Use Development Builds
- Using libraries with native code not in Expo Go
- Custom native configurations
- Testing production-like environment
- Team distribution for testing

## Common Patterns

### Environment Variables
```javascript
// app.config.js
module.exports = {
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL
  }
};

// Usage in app
import Constants from 'expo-constants';
const apiUrl = Constants.expoConfig?.extra?.apiUrl;
```

### Config Plugins
```json
{
  "plugins": [
    ["expo-camera", { "cameraPermission": "Allow access to camera" }],
    ["expo-location", { "locationAlwaysAndWhenInUsePermission": "Allow location access" }],
    "./my-custom-plugin"
  ]
}
```

### Installing Native Libraries
```bash
npx expo install expo-camera expo-location expo-notifications
# After adding native libraries, rebuild:
npx eas build --profile development
```

## Troubleshooting

### Clear Caches
```bash
npx expo start --clear
rm -rf node_modules && npm install
npx expo prebuild --clean
```

### Common Issues
- **Metro bundler errors**: Clear cache with `--clear` flag
- **Native module not found**: Rebuild development build after adding native packages
- **EAS Build failures**: Check build logs, ensure credentials are configured
- **Update not appearing**: Force close app twice to download and apply update

## Key Concepts

### Continuous Native Generation (CNG)
Native projects (android/, ios/) are generated from app.json via `npx expo prebuild`. Keep these in .gitignore and regenerate as needed.

### EAS Update (OTA Updates)
Push JavaScript/asset updates without app store review:
```bash
eas update --channel production --message "Bug fix"
```

### Runtime Versions
Ensure updates are compatible with native code:
```json
{
  "runtimeVersion": {
    "policy": "appVersion"
  }
}
```

## Reference Documentation

For detailed API references, SDK modules, and advanced configurations, see:
- [references/router-patterns.md](references/router-patterns.md) - Advanced Expo Router patterns
- [references/eas-workflows.md](references/eas-workflows.md) - CI/CD with EAS Workflows
- [references/sdk-modules.md](references/sdk-modules.md) - Common Expo SDK modules

Official docs: https://docs.expo.dev
