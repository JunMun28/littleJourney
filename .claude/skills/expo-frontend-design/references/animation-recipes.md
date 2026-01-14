# Animation Recipes

Copy-paste Reanimated animations for common UI patterns.

## Installation

```bash
npx expo install react-native-reanimated react-native-gesture-handler
```

Add to `babel.config.js`:
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

## Page Entrance Animations

### Fade In Up (Single Element)

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';

const FadeInUp = ({ children, delay = 0 }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 600 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
};
```

### Staggered List Entrance

```tsx
import Animated, { FadeInDown } from 'react-native-reanimated';

const StaggeredList = ({ items, renderItem }) => (
  <>
    {items.map((item, index) => (
      <Animated.View
        key={item.id}
        entering={FadeInDown
          .delay(index * 100)
          .springify()
          .damping(15)
        }
      >
        {renderItem(item)}
      </Animated.View>
    ))}
  </>
);

// Usage
<StaggeredList
  items={cards}
  renderItem={(card) => <Card {...card} />}
/>
```

### Scale In (Modal/Card)

```tsx
const ScaleIn = ({ children, delay = 0 }) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 300 });
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
};
```

## Button Interactions

### Press Scale Effect

```tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const PressableScale = ({ children, onPress, scaleTo = 0.95 }) => {
  const scale = useSharedValue(1);

  const gesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(scaleTo, { damping: 15, stiffness: 400 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    })
    .onEnd(() => {
      runOnJS(onPress)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  );
};
```

### Haptic Button

```tsx
import * as Haptics from 'expo-haptics';

const HapticButton = ({ children, onPress, style }) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
      onPress={handlePress}
    >
      <Animated.View style={[style, useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
      }))]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};
```

## Scroll-Based Animations

### Parallax Header

```tsx
const ParallaxHeader = ({ scrollY, imageSource, title }) => {
  const HEADER_HEIGHT = 300;

  const imageStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
      [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.5]
    );
    const scale = interpolate(
      scrollY.value,
      [-HEADER_HEIGHT, 0],
      [2, 1],
      'clamp'
    );
    return {
      transform: [{ translateY }, { scale }],
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT / 2],
      [0.3, 0.8],
      'clamp'
    );
    return { opacity };
  });

  return (
    <View style={{ height: HEADER_HEIGHT, overflow: 'hidden' }}>
      <Animated.Image source={imageSource} style={[styles.headerImage, imageStyle]} />
      <Animated.View style={[styles.overlay, overlayStyle]} />
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
};

// In parent component
const scrollY = useSharedValue(0);
const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    scrollY.value = event.contentOffset.y;
  },
});

<Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
  <ParallaxHeader scrollY={scrollY} ... />
  {/* Content */}
</Animated.ScrollView>
```

### Shrinking Header

```tsx
const ShrinkingHeader = ({ scrollY }) => {
  const MAX_HEIGHT = 120;
  const MIN_HEIGHT = 60;

  const headerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, 100],
      [MAX_HEIGHT, MIN_HEIGHT],
      'clamp'
    );
    return { height };
  });

  const titleStyle = useAnimatedStyle(() => {
    const fontSize = interpolate(
      scrollY.value,
      [0, 100],
      [32, 20],
      'clamp'
    );
    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, -10],
      'clamp'
    );
    return {
      fontSize,
      transform: [{ translateY }],
    };
  });

  return (
    <Animated.View style={[styles.header, headerStyle]}>
      <Animated.Text style={[styles.title, titleStyle]}>
        Profile
      </Animated.Text>
    </Animated.View>
  );
};
```

## Gesture Animations

### Swipeable Card

```tsx
const SwipeableCard = ({ children, onSwipeLeft, onSwipeRight }) => {
  const translateX = useSharedValue(0);
  const SWIPE_THRESHOLD = 100;

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withSpring(400);
        runOnJS(onSwipeRight)();
      } else if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-400);
        runOnJS(onSwipeLeft)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-200, 0, 200], [-15, 0, 15]);
    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={cardStyle}>{children}</Animated.View>
    </GestureDetector>
  );
};
```

### Pull to Refresh Indicator

```tsx
const PullToRefresh = ({ scrollY, onRefresh }) => {
  const THRESHOLD = 80;

  const indicatorStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [-THRESHOLD, 0],
      [0, -60],
      'clamp'
    );
    const scale = interpolate(
      scrollY.value,
      [-THRESHOLD, -THRESHOLD / 2, 0],
      [1, 0.5, 0],
      'clamp'
    );
    const rotate = interpolate(
      scrollY.value,
      [-THRESHOLD, 0],
      [180, 0]
    );
    return {
      transform: [
        { translateY },
        { scale },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[styles.indicator, indicatorStyle]}>
      <Text>↓</Text>
    </Animated.View>
  );
};
```

## Micro-interactions

### Toggle Switch

```tsx
const AnimatedToggle = ({ value, onValueChange }) => {
  const translateX = useSharedValue(value ? 24 : 0);
  const backgroundColor = useSharedValue(value ? '#6366F1' : '#E5E5E5');

  useEffect(() => {
    translateX.value = withSpring(value ? 24 : 0, { damping: 15 });
    backgroundColor.value = withTiming(value ? '#6366F1' : '#E5E5E5');
  }, [value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Pressable onPress={() => onValueChange(!value)}>
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: {
    width: 52,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
```

### Like Button (Heart Animation)

```tsx
const LikeButton = ({ liked, onPress }) => {
  const scale = useSharedValue(1);
  const fillProgress = useSharedValue(liked ? 1 : 0);

  const handlePress = () => {
    // Bounce animation
    scale.value = withSequence(
      withSpring(1.3, { damping: 2, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    fillProgress.value = withTiming(liked ? 0 : 1, { duration: 300 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    opacity: fillProgress.value,
  }));

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={heartStyle}>
        {/* Outline heart */}
        <Text style={styles.heartOutline}>♡</Text>
        {/* Filled heart */}
        <Animated.Text style={[styles.heartFilled, fillStyle]}>
          ❤️
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
};
```

### Loading Dots

```tsx
const LoadingDots = () => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animate = () => {
      dot1.value = withSequence(
        withTiming(-8, { duration: 300 }),
        withTiming(0, { duration: 300 })
      );
      dot2.value = withDelay(150, withSequence(
        withTiming(-8, { duration: 300 }),
        withTiming(0, { duration: 300 })
      ));
      dot3.value = withDelay(300, withSequence(
        withTiming(-8, { duration: 300 }),
        withTiming(0, { duration: 300 })
      ));
    };
    
    animate();
    const interval = setInterval(animate, 900);
    return () => clearInterval(interval);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1.value }],
  }));
  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2.value }],
  }));
  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, dot1Style]} />
      <Animated.View style={[styles.dot, dot2Style]} />
      <Animated.View style={[styles.dot, dot3Style]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366F1',
  },
});
```

## Shared Element Transitions

```tsx
import { SharedTransition, withSpring } from 'react-native-reanimated';

// Define custom transition
const customTransition = SharedTransition.custom((values) => {
  'worklet';
  return {
    width: withSpring(values.targetWidth),
    height: withSpring(values.targetHeight),
    originX: withSpring(values.targetOriginX),
    originY: withSpring(values.targetOriginY),
  };
});

// Source screen
<Animated.Image
  source={{ uri: item.image }}
  sharedTransitionTag={`image-${item.id}`}
  sharedTransitionStyle={customTransition}
  style={styles.thumbnail}
/>

// Destination screen
<Animated.Image
  source={{ uri: item.image }}
  sharedTransitionTag={`image-${item.id}`}
  sharedTransitionStyle={customTransition}
  style={styles.fullImage}
/>
```
