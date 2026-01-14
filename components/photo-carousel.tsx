import { useState, useRef, useCallback } from "react";
import {
  View,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";

interface PhotoCarouselProps {
  images: string[];
  aspectRatio?: number;
  onImagePress?: (index: number) => void;
}

export function PhotoCarousel({
  images,
  aspectRatio = 1,
  onImagePress,
}: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const layoutWidth = event.nativeEvent.layoutMeasurement.width;
      const newIndex = Math.round(contentOffsetX / layoutWidth);
      if (
        newIndex !== activeIndex &&
        newIndex >= 0 &&
        newIndex < images.length
      ) {
        setActiveIndex(newIndex);
      }
    },
    [activeIndex, images.length],
  );

  const showDots = images.length > 1;

  return (
    <View>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        testID="carousel-scroll-view"
      >
        {images.map((uri, index) => (
          <Pressable
            key={`${uri}-${index}`}
            onPress={() => onImagePress?.(index)}
            testID={`carousel-image-${index}`}
          >
            <Image source={{ uri }} style={[styles.image, { aspectRatio }]} />
          </Pressable>
        ))}
      </ScrollView>

      {showDots && (
        <View style={styles.dotsContainer}>
          {images.map((_, index) => (
            <View
              key={index}
              testID={`dot-indicator-${index}`}
              style={[styles.dot, { opacity: index === activeIndex ? 1 : 0.4 }]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const styles = StyleSheet.create({
  image: {
    width: SCREEN_WIDTH,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#333",
  },
});
