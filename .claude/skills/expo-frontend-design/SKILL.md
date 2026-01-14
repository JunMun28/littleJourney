---
name: expo-frontend-design
description: Create distinctive, production-grade mobile interfaces for Expo and React Native apps with exceptional design quality. Use this skill when building screens, components, navigation layouts, or styling mobile UIs. Triggers include requests to design app screens, create beautiful mobile interfaces, style React Native components, build onboarding flows, design tab bars, create custom animations, or any mobile UI/UX work in Expo projects.
---

# Expo Frontend Design Skill

Create distinctive, production-grade mobile interfaces that avoid generic patterns and deliver memorable user experiences.

## Design Philosophy

Before coding, commit to a **BOLD aesthetic direction**:

### Context Questions
- **Purpose**: What problem does this screen solve? What's the user's emotional state?
- **Brand Tone**: Playful/whimsical, luxury/refined, brutalist/raw, organic/soft, retro/nostalgic, futuristic/tech, editorial/magazine, warm/human?
- **Platform Feel**: iOS-native elegance, Android material boldness, or cross-platform distinctive?
- **Memorability**: What's the ONE thing users will remember about this interface?

### Design Extremes to Consider
- Brutally minimal with generous whitespace
- Maximalist with layered depth and rich textures
- Soft/organic with rounded forms and gentle gradients
- Sharp/geometric with precise angles and grids
- Retro-inspired with nostalgic palettes and typography
- Dark/moody with dramatic shadows and highlights
- Light/airy with pastels and subtle shadows
- Bold/graphic with strong color blocks and typography

**CRITICAL**: Choose a direction and execute with precision. Mediocre execution of a bold vision beats perfect execution of a safe one.

## Typography System

### Font Selection Strategy

Never use: System defaults, San Francisco/Roboto alone, Inter, Arial, generic sans-serifs.

Instead, choose distinctive fonts that match your aesthetic:

```typescript
// expo-font + Google Fonts approach
import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_700Bold,
  PlayfairDisplay_400Regular,
} from '@expo-google-fonts/playfair-display';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

// Load fonts in root layout
const [fontsLoaded] = useFonts({
  PlayfairDisplay_700Bold,
  PlayfairDisplay_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
});
```

### Font Pairing Ideas

| Aesthetic | Display Font | Body Font |
|-----------|-------------|-----------|
| Luxury Editorial | Playfair Display, Cormorant Garamond | Lato, Source Sans Pro |
| Modern Tech | Clash Display, Cabinet Grotesk | DM Sans, Plus Jakarta Sans |
| Playful/Friendly | Fredoka, Nunito | Quicksand, Karla |
| Brutalist/Raw | Anton, Bebas Neue | JetBrains Mono, IBM Plex Mono |
| Organic/Soft | Fraunces, Lora | Outfit, Rubik |
| Retro/Nostalgic | Abril Fatface, Bodoni Moda | Old Standard TT, Libre Baskerville |
| Geometric/Art Deco | Poiret One, Josefin Sans | Raleway, Montserrat |

### Type Scale

```typescript
const typography = {
  // Display - Hero moments only
  display: { fontSize: 48, lineHeight: 52, letterSpacing: -1.5 },
  
  // Headlines
  h1: { fontSize: 32, lineHeight: 40, letterSpacing: -0.5 },
  h2: { fontSize: 24, lineHeight: 32, letterSpacing: -0.25 },
  h3: { fontSize: 20, lineHeight: 28, letterSpacing: 0 },
  
  // Body
  bodyLarge: { fontSize: 18, lineHeight: 28, letterSpacing: 0.15 },
  body: { fontSize: 16, lineHeight: 24, letterSpacing: 0.25 },
  bodySmall: { fontSize: 14, lineHeight: 20, letterSpacing: 0.25 },
  
  // UI Elements
  label: { fontSize: 12, lineHeight: 16, letterSpacing: 0.5, textTransform: 'uppercase' },
  caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
};
```

## Color Systems

### Building a Distinctive Palette

```typescript
// DON'T: Generic purple gradient on white
// DO: Commit to a specific mood

// Example: Warm Terracotta Theme
const warmPalette = {
  // Dominant
  background: '#FDF6F0',
  surface: '#FFFFFF',
  
  // Primary - The star
  primary: '#C4642A',
  primaryLight: '#E8956A',
  primaryDark: '#8B4513',
  
  // Accent - Unexpected complement
  accent: '#2D5A5A',
  accentLight: '#4A8B8B',
  
  // Neutrals with warmth
  text: '#2C1810',
  textSecondary: '#6B5344',
  textTertiary: '#A08679',
  
  // Semantic
  success: '#4A7C59',
  warning: '#D4A84B',
  error: '#C73E3E',
};

// Example: Dark Moody Theme
const darkMoodyPalette = {
  background: '#0A0A0B',
  surface: '#141416',
  surfaceElevated: '#1C1C1F',
  
  primary: '#6366F1',
  primaryGlow: 'rgba(99, 102, 241, 0.3)',
  
  accent: '#F472B6',
  
  text: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textTertiary: '#52525B',
  
  border: '#27272A',
  borderSubtle: '#1F1F22',
};
```

### Color Application Principles

1. **60-30-10 Rule**: 60% dominant, 30% secondary, 10% accent
2. **Semantic Consistency**: Same action = same color everywhere
3. **Contrast Ratios**: 4.5:1 minimum for body text, 3:1 for large text
4. **Depth Through Color**: Lighter surfaces feel elevated in light mode, darker in dark mode

## Spatial Design

### Spacing Scale

```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
};

// Screen padding
const screenPadding = {
  horizontal: spacing.lg, // 24px sides
  top: spacing.xl,        // 32px from safe area
  bottom: spacing['2xl'], // 48px for thumb reach
};
```

### Layout Principles

```typescript
// Generous padding creates premium feel
const PremiumCard = styled(View)`
  padding: ${spacing.lg}px ${spacing.xl}px;
  margin: ${spacing.md}px;
`;

// Asymmetry creates visual interest
const AsymmetricLayout = () => (
  <View style={{ paddingLeft: 24, paddingRight: 48 }}>
    {/* Content shifted left creates tension */}
  </View>
);

// Overlap creates depth
const OverlappingElements = () => (
  <View>
    <Image style={{ position: 'absolute', top: -40 }} />
    <Card style={{ marginTop: 60, zIndex: 1 }} />
  </View>
);
```

## Animation & Motion

### Using Reanimated for Delight

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';

// Staggered entrance - High impact
const StaggeredList = ({ items }) => {
  return items.map((item, index) => (
    <AnimatedCard 
      key={item.id}
      delay={index * 100}
      {...item}
    />
  ));
};

const AnimatedCard = ({ delay, children }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 15 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};
```

### Spring Configurations

```typescript
// Snappy - Buttons, toggles
const snappy = { damping: 15, stiffness: 300 };

// Gentle - Cards, modals
const gentle = { damping: 20, stiffness: 150 };

// Bouncy - Playful interactions
const bouncy = { damping: 10, stiffness: 200 };

// Smooth - Page transitions
const smooth = { damping: 25, stiffness: 120 };
```

### Gesture-Driven Animations

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const SwipeableCard = () => {
  const translateX = useSharedValue(0);
  const context = useSharedValue({ x: 0 });

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value };
    })
    .onUpdate((event) => {
      translateX.value = event.translationX + context.value.x;
    })
    .onEnd((event) => {
      if (Math.abs(event.velocityX) > 500) {
        translateX.value = withSpring(
          event.velocityX > 0 ? 300 : -300,
          { velocity: event.velocityX }
        );
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle}>
        {/* Card content */}
      </Animated.View>
    </GestureDetector>
  );
};
```

## Visual Effects & Depth

### Shadows That Feel Native

```typescript
// iOS-style layered shadows
const elegantShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};

// Dramatic floating effect
const floatingShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.15,
  shadowRadius: 24,
  elevation: 12,
};

// Colored shadow (matches element)
const coloredShadow = (color: string) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.3,
  shadowRadius: 16,
  elevation: 8,
});
```

### Blur Effects

```typescript
import { BlurView } from 'expo-blur';

// Frosted glass effect
const FrostedCard = () => (
  <BlurView intensity={80} tint="light" style={styles.card}>
    <View style={styles.content}>
      {/* Content */}
    </View>
  </BlurView>
);

// Background blur for modals
const BlurredModal = () => (
  <BlurView intensity={50} style={StyleSheet.absoluteFill}>
    <View style={styles.modalContent}>
      {/* Modal */}
    </View>
  </BlurView>
);
```

### Gradients

```typescript
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

// Gradient background
const GradientBackground = () => (
  <LinearGradient
    colors={['#667eea', '#764ba2']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={StyleSheet.absoluteFill}
  />
);

// Gradient text
const GradientText = ({ children }) => (
  <MaskedView maskElement={<Text style={styles.text}>{children}</Text>}>
    <LinearGradient colors={['#f12711', '#f5af19']}>
      <Text style={[styles.text, { opacity: 0 }]}>{children}</Text>
    </LinearGradient>
  </MaskedView>
);

// Fade overlay for images
const ImageWithFade = ({ source }) => (
  <View>
    <Image source={source} style={styles.image} />
    <LinearGradient
      colors={['transparent', 'rgba(0,0,0,0.8)']}
      style={styles.fadeOverlay}
    />
  </View>
);
```

## Component Patterns

### Buttons That Feel Alive

```typescript
const AnimatedButton = ({ onPress, children, variant = 'primary' }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const gesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.95, snappy);
      opacity.value = withTiming(0.8, { duration: 100 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, snappy);
      opacity.value = withTiming(1, { duration: 100 });
    })
    .onEnd(onPress);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles[variant], animatedStyle]}>
        <Text style={styles.buttonText}>{children}</Text>
      </Animated.View>
    </GestureDetector>
  );
};
```

### Cards With Presence

```typescript
const PremiumCard = ({ title, subtitle, image, onPress }) => (
  <Pressable 
    onPress={onPress}
    style={({ pressed }) => [
      styles.card,
      pressed && styles.cardPressed
    ]}
  >
    <Image source={image} style={styles.cardImage} />
    <LinearGradient
      colors={['transparent', 'rgba(0,0,0,0.7)']}
      style={styles.cardGradient}
    />
    <View style={styles.cardContent}>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    ...floatingShadow,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
    top: '50%',
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  cardTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: '#fff',
  },
  cardSubtitle: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
});
```

## Anti-Patterns to Avoid

### NEVER Do This

```typescript
// ❌ Generic, forgettable
const BadCard = () => (
  <View style={{
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowOpacity: 0.1,
  }}>
    <Text style={{ fontSize: 16, color: '#333' }}>Title</Text>
    <Text style={{ fontSize: 14, color: '#666' }}>Description</Text>
  </View>
);

// ❌ Purple gradient on white (AI cliché)
const BadGradient = () => (
  <LinearGradient colors={['#667eea', '#764ba2']}>
    <Text style={{ color: '#fff' }}>Generic AI Design</Text>
  </LinearGradient>
);

// ❌ System fonts, no personality
const BadTypography = () => (
  <Text style={{ fontWeight: 'bold', fontSize: 24 }}>
    Boring Header
  </Text>
);
```

### DO This Instead

```typescript
// ✅ Distinctive, memorable
const GoodCard = () => (
  <Animated.View style={[styles.card, animatedStyle]}>
    <BlurView intensity={40} style={styles.cardBlur}>
      <Text style={styles.cardLabel}>FEATURED</Text>
      <Text style={styles.cardTitle}>Something Memorable</Text>
      <Text style={styles.cardDescription}>
        With personality and presence
      </Text>
    </BlurView>
  </Animated.View>
);
```

## Reference Documentation

For detailed patterns and examples:
- [references/screen-templates.md](references/screen-templates.md) - Complete screen designs
- [references/animation-recipes.md](references/animation-recipes.md) - Copy-paste animation code
- [references/theme-examples.md](references/theme-examples.md) - Full theme configurations

Remember: Every screen is an opportunity to create something memorable. Don't settle for generic.
