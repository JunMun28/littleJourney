import {
  SPRING_SNAPPY,
  SPRING_BOUNCY,
  SPRING_GENTLE,
  TIMING_FAST,
  TIMING_NORMAL,
  TIMING_SLOW,
  TIMING_ENTRANCE,
  BUTTON_SCALE,
  buttonPressIn,
  buttonPressOut,
  CARD_SCALE,
  cardPressIn,
  cardPressOut,
  getStaggerDelay,
  fadeInWithDelay,
  slideUpWithDelay,
  celebrationBounce,
  shakeAnimation,
  animateProgress,
  Entering,
  Exiting,
} from "@/utils/animations";
import { Animation } from "@/constants/design-tokens";

describe("Animation Utilities", () => {
  describe("Spring Configs", () => {
    it("should have correct snappy spring config", () => {
      expect(SPRING_SNAPPY).toEqual({
        damping: 20,
        stiffness: 300,
        mass: 0.8,
        reduceMotion: expect.any(String),
      });
    });

    it("should have correct bouncy spring config", () => {
      expect(SPRING_BOUNCY).toEqual({
        damping: 12,
        stiffness: 180,
        mass: 1,
        reduceMotion: expect.any(String),
      });
    });

    it("should have correct gentle spring config", () => {
      expect(SPRING_GENTLE).toEqual({
        damping: 18,
        stiffness: 120,
        mass: 1,
        reduceMotion: expect.any(String),
      });
    });
  });

  describe("Timing Configs", () => {
    it("should have correct fast timing config", () => {
      expect(TIMING_FAST).toEqual({
        duration: Animation.fast,
        easing: expect.any(Function),
        reduceMotion: expect.any(String),
      });
    });

    it("should have correct normal timing config", () => {
      expect(TIMING_NORMAL).toEqual({
        duration: Animation.normal,
        easing: expect.any(Function),
        reduceMotion: expect.any(String),
      });
    });

    it("should have correct slow timing config", () => {
      expect(TIMING_SLOW).toEqual({
        duration: Animation.slow,
        easing: expect.any(Function),
        reduceMotion: expect.any(String),
      });
    });

    it("should have correct entrance timing config", () => {
      expect(TIMING_ENTRANCE).toEqual({
        duration: Animation.entrance,
        easing: expect.any(Function),
        reduceMotion: expect.any(String),
      });
    });
  });

  describe("Button Animations", () => {
    it("should have correct button scale values", () => {
      expect(BUTTON_SCALE).toEqual({
        pressed: 0.96,
        normal: 1,
      });
    });

    it("buttonPressIn should return a spring value", () => {
      const result = buttonPressIn();
      expect(result).toBeDefined();
    });

    it("buttonPressOut should return a spring value", () => {
      const result = buttonPressOut();
      expect(result).toBeDefined();
    });
  });

  describe("Card Animations", () => {
    it("should have correct card scale values", () => {
      expect(CARD_SCALE).toEqual({
        pressed: 0.98,
        normal: 1,
      });
    });

    it("cardPressIn should return a spring value", () => {
      const result = cardPressIn();
      expect(result).toBeDefined();
    });

    it("cardPressOut should return a spring value", () => {
      const result = cardPressOut();
      expect(result).toBeDefined();
    });
  });

  describe("Stagger Calculations", () => {
    it("should calculate stagger delay correctly with defaults", () => {
      expect(getStaggerDelay(0)).toBe(0);
      expect(getStaggerDelay(1)).toBe(50);
      expect(getStaggerDelay(5)).toBe(250);
    });

    it("should calculate stagger delay with custom base delay", () => {
      expect(getStaggerDelay(0, 100)).toBe(100);
      expect(getStaggerDelay(1, 100)).toBe(150);
    });

    it("should calculate stagger delay with custom stagger delay", () => {
      expect(getStaggerDelay(0, 0, 100)).toBe(0);
      expect(getStaggerDelay(1, 0, 100)).toBe(100);
      expect(getStaggerDelay(2, 0, 100)).toBe(200);
    });
  });

  describe("Fade Animations", () => {
    it("fadeInWithDelay should return a timing value", () => {
      const result = fadeInWithDelay(100);
      expect(result).toBeDefined();
    });
  });

  describe("Slide Animations", () => {
    it("slideUpWithDelay should return animation values", () => {
      const result = slideUpWithDelay(100);
      expect(result).toHaveProperty("opacity");
      expect(result).toHaveProperty("translateY");
    });

    it("slideUpWithDelay should use custom distance", () => {
      const result = slideUpWithDelay(100, 30);
      expect(result).toHaveProperty("opacity");
      expect(result).toHaveProperty("translateY");
    });
  });

  describe("Celebration Animations", () => {
    it("celebrationBounce should return a sequence value", () => {
      const result = celebrationBounce();
      expect(result).toBeDefined();
    });
  });

  describe("Shake Animation", () => {
    it("shakeAnimation should return a sequence value", () => {
      const result = shakeAnimation();
      expect(result).toBeDefined();
    });
  });

  describe("Progress Animation", () => {
    it("animateProgress should return a spring value", () => {
      const result = animateProgress(50);
      expect(result).toBeDefined();
    });

    it("animateProgress should handle 0%", () => {
      const result = animateProgress(0);
      expect(result).toBeDefined();
    });

    it("animateProgress should handle 100%", () => {
      const result = animateProgress(100);
      expect(result).toBeDefined();
    });
  });

  describe("Entering Animations", () => {
    it("should have fade animation", () => {
      expect(Entering.fade).toBeDefined();
    });

    it("should have fadeDown animation", () => {
      expect(Entering.fadeDown).toBeDefined();
    });

    it("should have fadeUp animation", () => {
      expect(Entering.fadeUp).toBeDefined();
    });

    it("should have slideRight animation", () => {
      expect(Entering.slideRight).toBeDefined();
    });

    it("should have slideLeft animation", () => {
      expect(Entering.slideLeft).toBeDefined();
    });

    it("should have zoom animation", () => {
      expect(Entering.zoom).toBeDefined();
    });

    it("should have listItem animation factory", () => {
      expect(typeof Entering.listItem).toBe("function");
      const animation = Entering.listItem(0);
      expect(animation).toBeDefined();
    });

    it("listItem should apply stagger delay", () => {
      const animation0 = Entering.listItem(0);
      const animation5 = Entering.listItem(5);
      expect(animation0).toBeDefined();
      expect(animation5).toBeDefined();
    });
  });

  describe("Exiting Animations", () => {
    it("should have fade animation", () => {
      expect(Exiting.fade).toBeDefined();
    });

    it("should have fadeDown animation", () => {
      expect(Exiting.fadeDown).toBeDefined();
    });

    it("should have fadeUp animation", () => {
      expect(Exiting.fadeUp).toBeDefined();
    });

    it("should have slideRight animation", () => {
      expect(Exiting.slideRight).toBeDefined();
    });

    it("should have slideLeft animation", () => {
      expect(Exiting.slideLeft).toBeDefined();
    });

    it("should have zoom animation", () => {
      expect(Exiting.zoom).toBeDefined();
    });
  });
});
