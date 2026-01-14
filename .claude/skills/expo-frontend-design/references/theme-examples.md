# Theme Examples

Complete theme configurations for different aesthetics.

## Theme Structure

```typescript
// types/theme.ts
export interface Theme {
  colors: {
    background: string;
    surface: string;
    surfaceElevated: string;
    primary: string;
    primaryLight: string;
    primaryDark: string;
    accent: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  typography: {
    display: TextStyle;
    h1: TextStyle;
    h2: TextStyle;
    h3: TextStyle;
    bodyLarge: TextStyle;
    body: TextStyle;
    bodySmall: TextStyle;
    label: TextStyle;
    caption: TextStyle;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  shadows: {
    sm: ViewStyle;
    md: ViewStyle;
    lg: ViewStyle;
  };
}
```

---

## 1. Warm Terracotta (Baby Journal / Lifestyle)

```typescript
export const warmTerracottaTheme: Theme = {
  colors: {
    background: '#FDF6F0',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFCF9',
    primary: '#C4642A',
    primaryLight: '#E8956A',
    primaryDark: '#8B4513',
    accent: '#2D5A5A',
    text: '#2C1810',
    textSecondary: '#6B5344',
    textTertiary: '#A08679',
    border: '#E8DED4',
    success: '#4A7C59',
    warning: '#D4A84B',
    error: '#C73E3E',
  },
  typography: {
    display: {
      fontFamily: 'PlayfairDisplay_700Bold',
      fontSize: 48,
      lineHeight: 56,
      letterSpacing: -1,
      color: '#2C1810',
    },
    h1: {
      fontFamily: 'PlayfairDisplay_700Bold',
      fontSize: 32,
      lineHeight: 40,
      color: '#2C1810',
    },
    h2: {
      fontFamily: 'PlayfairDisplay_600SemiBold',
      fontSize: 24,
      lineHeight: 32,
      color: '#2C1810',
    },
    h3: {
      fontFamily: 'SpaceGrotesk_600SemiBold',
      fontSize: 18,
      lineHeight: 24,
      color: '#2C1810',
    },
    bodyLarge: {
      fontFamily: 'Lato_400Regular',
      fontSize: 18,
      lineHeight: 28,
      color: '#2C1810',
    },
    body: {
      fontFamily: 'Lato_400Regular',
      fontSize: 16,
      lineHeight: 24,
      color: '#2C1810',
    },
    bodySmall: {
      fontFamily: 'Lato_400Regular',
      fontSize: 14,
      lineHeight: 20,
      color: '#6B5344',
    },
    label: {
      fontFamily: 'SpaceGrotesk_500Medium',
      fontSize: 11,
      lineHeight: 16,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: '#C4642A',
    },
    caption: {
      fontFamily: 'Lato_400Regular',
      fontSize: 12,
      lineHeight: 16,
      color: '#A08679',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 28,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#2C1810',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#2C1810',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: '#2C1810',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 8,
    },
  },
};
```

---

## 2. Dark Moody (Premium / Tech)

```typescript
export const darkMoodyTheme: Theme = {
  colors: {
    background: '#0A0A0B',
    surface: '#141416',
    surfaceElevated: '#1C1C1F',
    primary: '#6366F1',
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    accent: '#F472B6',
    text: '#FAFAFA',
    textSecondary: '#A1A1AA',
    textTertiary: '#52525B',
    border: '#27272A',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  typography: {
    display: {
      fontFamily: 'ClashDisplay_700Bold',
      fontSize: 48,
      lineHeight: 52,
      letterSpacing: -2,
      color: '#FAFAFA',
    },
    h1: {
      fontFamily: 'ClashDisplay_600SemiBold',
      fontSize: 32,
      lineHeight: 40,
      letterSpacing: -0.5,
      color: '#FAFAFA',
    },
    h2: {
      fontFamily: 'ClashDisplay_600SemiBold',
      fontSize: 24,
      lineHeight: 32,
      color: '#FAFAFA',
    },
    h3: {
      fontFamily: 'DMSans_600SemiBold',
      fontSize: 18,
      lineHeight: 24,
      color: '#FAFAFA',
    },
    bodyLarge: {
      fontFamily: 'DMSans_400Regular',
      fontSize: 18,
      lineHeight: 28,
      color: '#FAFAFA',
    },
    body: {
      fontFamily: 'DMSans_400Regular',
      fontSize: 16,
      lineHeight: 24,
      color: '#A1A1AA',
    },
    bodySmall: {
      fontFamily: 'DMSans_400Regular',
      fontSize: 14,
      lineHeight: 20,
      color: '#71717A',
    },
    label: {
      fontFamily: 'DMSans_500Medium',
      fontSize: 11,
      lineHeight: 16,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      color: '#6366F1',
    },
    caption: {
      fontFamily: 'DMSans_400Regular',
      fontSize: 12,
      lineHeight: 16,
      color: '#52525B',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 8,
    },
  },
};
```

---

## 3. Soft Pastel (Playful / Kids)

```typescript
export const softPastelTheme: Theme = {
  colors: {
    background: '#FFF9F5',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFDFB',
    primary: '#FF9F7A',
    primaryLight: '#FFBFA3',
    primaryDark: '#E87D52',
    accent: '#7DD3C0',
    text: '#3D3D3D',
    textSecondary: '#6B6B6B',
    textTertiary: '#9B9B9B',
    border: '#F0E8E3',
    success: '#7DD3A8',
    warning: '#FFD07A',
    error: '#FF7A7A',
  },
  typography: {
    display: {
      fontFamily: 'Nunito_800ExtraBold',
      fontSize: 44,
      lineHeight: 52,
      color: '#3D3D3D',
    },
    h1: {
      fontFamily: 'Nunito_700Bold',
      fontSize: 28,
      lineHeight: 36,
      color: '#3D3D3D',
    },
    h2: {
      fontFamily: 'Nunito_700Bold',
      fontSize: 22,
      lineHeight: 28,
      color: '#3D3D3D',
    },
    h3: {
      fontFamily: 'Quicksand_600SemiBold',
      fontSize: 18,
      lineHeight: 24,
      color: '#3D3D3D',
    },
    bodyLarge: {
      fontFamily: 'Quicksand_500Medium',
      fontSize: 18,
      lineHeight: 28,
      color: '#3D3D3D',
    },
    body: {
      fontFamily: 'Quicksand_500Medium',
      fontSize: 16,
      lineHeight: 24,
      color: '#6B6B6B',
    },
    bodySmall: {
      fontFamily: 'Quicksand_500Medium',
      fontSize: 14,
      lineHeight: 20,
      color: '#9B9B9B',
    },
    label: {
      fontFamily: 'Nunito_600SemiBold',
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: '#FF9F7A',
    },
    caption: {
      fontFamily: 'Quicksand_400Regular',
      fontSize: 12,
      lineHeight: 16,
      color: '#9B9B9B',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  borderRadius: {
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#FF9F7A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: '#FF9F7A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 4,
    },
    lg: {
      shadowColor: '#FF9F7A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 32,
      elevation: 8,
    },
  },
};
```

---

## 4. Monochrome Minimal (Editorial / Luxury)

```typescript
export const monochromeMinimalTheme: Theme = {
  colors: {
    background: '#FFFFFF',
    surface: '#FAFAFA',
    surfaceElevated: '#FFFFFF',
    primary: '#000000',
    primaryLight: '#333333',
    primaryDark: '#000000',
    accent: '#FF3B30',
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    border: '#E5E5E5',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
  },
  typography: {
    display: {
      fontFamily: 'CormorantGaramond_700Bold',
      fontSize: 56,
      lineHeight: 60,
      letterSpacing: -2,
      color: '#000000',
    },
    h1: {
      fontFamily: 'CormorantGaramond_600SemiBold',
      fontSize: 36,
      lineHeight: 44,
      letterSpacing: -1,
      color: '#000000',
    },
    h2: {
      fontFamily: 'CormorantGaramond_600SemiBold',
      fontSize: 28,
      lineHeight: 36,
      color: '#000000',
    },
    h3: {
      fontFamily: 'SourceSansPro_600SemiBold',
      fontSize: 18,
      lineHeight: 24,
      color: '#000000',
    },
    bodyLarge: {
      fontFamily: 'SourceSansPro_400Regular',
      fontSize: 18,
      lineHeight: 32,
      color: '#333333',
    },
    body: {
      fontFamily: 'SourceSansPro_400Regular',
      fontSize: 16,
      lineHeight: 28,
      color: '#333333',
    },
    bodySmall: {
      fontFamily: 'SourceSansPro_400Regular',
      fontSize: 14,
      lineHeight: 22,
      color: '#666666',
    },
    label: {
      fontFamily: 'SourceSansPro_600SemiBold',
      fontSize: 10,
      lineHeight: 12,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: '#999999',
    },
    caption: {
      fontFamily: 'SourceSansPro_400Regular',
      fontSize: 12,
      lineHeight: 16,
      color: '#999999',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 40,
    '2xl': 64,
    '3xl': 96,
  },
  borderRadius: {
    sm: 2,
    md: 4,
    lg: 8,
    xl: 12,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 6,
    },
  },
};
```

---

## Theme Context Provider

```tsx
// context/ThemeContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { warmTerracottaTheme } from '../themes';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({
  theme: warmTerracottaTheme,
  setTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(warmTerracottaTheme);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

// Usage
const MyComponent = () => {
  const { theme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={theme.typography.h1}>Hello</Text>
    </View>
  );
};
```

---

## Font Loading Setup

```tsx
// app/_layout.tsx
import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
} from '@expo-google-fonts/space-grotesk';
import {
  Lato_400Regular,
  Lato_600SemiBold,
  Lato_700Bold,
} from '@expo-google-fonts/lato';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    Lato_400Regular,
    Lato_600SemiBold,
    Lato_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <Stack />
    </ThemeProvider>
  );
}
```
