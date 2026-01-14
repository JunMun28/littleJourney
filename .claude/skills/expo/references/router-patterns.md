# Expo Router Advanced Patterns

## File-Based Routing Notation

| Pattern | Example | URL | Description |
|---------|---------|-----|-------------|
| Static | `about.tsx` | `/about` | Fixed route |
| Dynamic | `[id].tsx` | `/123` | Single parameter |
| Catch-all | `[...slug].tsx` | `/a/b/c` | Multiple segments |
| Group | `(tabs)/` | N/A | Organizational only, not in URL |
| Layout | `_layout.tsx` | N/A | Wraps sibling routes |
| Not found | `+not-found.tsx` | N/A | 404 handler |

## Stack Navigator

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#f4511e' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="details" options={{ title: 'Details' }} />
      <Stack.Screen 
        name="modal" 
        options={{ 
          presentation: 'modal',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}
```

## Tab Navigator

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: { backgroundColor: '#fff' },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          tabBarBadge: 3, // Show badge
        }}
      />
    </Tabs>
  );
}
```

## Drawer Navigator

```bash
npx expo install @react-navigation/drawer react-native-gesture-handler react-native-reanimated
```

```tsx
// app/_layout.tsx
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer>
        <Drawer.Screen name="index" options={{ drawerLabel: 'Home' }} />
        <Drawer.Screen name="settings" options={{ drawerLabel: 'Settings' }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}
```

## Modal Presentation

```tsx
// app/_layout.tsx
<Stack>
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  <Stack.Screen
    name="modal"
    options={{
      presentation: 'modal',
      animation: 'slide_from_bottom',
    }}
  />
</Stack>

// Navigate to modal
router.push('/modal');
```

## Nested Navigation (Tabs inside Stack)

```
app/
├── _layout.tsx          # Stack navigator
├── (tabs)/
│   ├── _layout.tsx      # Tab navigator
│   ├── index.tsx        # Tab 1
│   └── explore.tsx      # Tab 2
├── details/[id].tsx     # Stack screen (pushes on top of tabs)
└── modal.tsx            # Modal screen
```

```tsx
// app/_layout.tsx
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="details/[id]" options={{ title: 'Details' }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
```

## Authentication Flow

### Using Redirect (Recommended)

```tsx
// app/(app)/_layout.tsx
import { Redirect, Stack } from 'expo-router';
import { useSession } from '../../ctx';

export default function AppLayout() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return <Stack />;
}
```

### Session Context

```tsx
// ctx.tsx
import { useContext, createContext, type PropsWithChildren } from 'react';
import { useStorageState } from './useStorageState';

const AuthContext = createContext<{
  signIn: (token: string) => void;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
}>({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
});

export function useSession() {
  const value = useContext(AuthContext);
  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState('session');

  return (
    <AuthContext.Provider
      value={{
        signIn: (token) => setSession(token),
        signOut: () => setSession(null),
        session,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

## Deep Linking

### URL Parameters

```tsx
// app/user/[id].tsx
import { useLocalSearchParams, useGlobalSearchParams } from 'expo-router';

export default function User() {
  // Route params only
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // All params including query string
  const { id, tab } = useGlobalSearchParams<{ id: string; tab?: string }>();
  
  return <Text>User {id}, Tab: {tab}</Text>;
}

// Navigate with query params
router.push('/user/123?tab=posts');
```

### Universal Links Setup

```json
// app.json
{
  "expo": {
    "scheme": "myapp",
    "ios": {
      "associatedDomains": ["applinks:example.com"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [{ "scheme": "https", "host": "example.com", "pathPrefix": "/" }],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

## API Routes (Web)

```tsx
// app/api/users+api.ts
export function GET(request: Request) {
  return Response.json({ users: [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  return Response.json({ created: body });
}
```

## Typed Routes

Enable in app.json:
```json
{
  "expo": {
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

TypeScript will now validate route paths:
```tsx
// ✅ Valid
router.push('/profile');
router.push({ pathname: '/user/[id]', params: { id: '123' } });

// ❌ Type error - route doesn't exist
router.push('/nonexistent');
```

## Screen Options

```tsx
// Static options
<Stack.Screen name="profile" options={{ title: 'Profile' }} />

// Dynamic options in screen
import { Stack } from 'expo-router';

export default function Profile() {
  return (
    <>
      <Stack.Screen options={{ title: 'My Profile' }} />
      <View>...</View>
    </>
  );
}

// Based on route params
<Stack.Screen
  name="[id]"
  options={({ route }) => ({ title: `Item ${route.params.id}` })}
/>
```

## Error Boundaries

```tsx
// app/+not-found.tsx
import { Link, Stack } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View>
        <Text>This screen doesn't exist.</Text>
        <Link href="/">Go to home</Link>
      </View>
    </>
  );
}
```
