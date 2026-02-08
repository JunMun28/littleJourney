import * as Haptics from "expo-haptics";
import {
  setHapticsEnabled,
  isHapticsEnabled,
  lightImpact,
  mediumImpact,
  heavyImpact,
  success,
  warning,
  error,
  selection,
  HapticPatterns,
  default as haptics,
} from "@/utils/haptics";

describe("Haptics Utility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setHapticsEnabled(true);
  });

  describe("Configuration", () => {
    it("should be enabled by default", () => {
      expect(isHapticsEnabled()).toBe(true);
    });

    it("should disable haptics when set to false", () => {
      setHapticsEnabled(false);
      expect(isHapticsEnabled()).toBe(false);
    });

    it("should enable haptics when set to true", () => {
      setHapticsEnabled(false);
      setHapticsEnabled(true);
      expect(isHapticsEnabled()).toBe(true);
    });
  });

  describe("Impact Feedback", () => {
    it("should trigger light impact", () => {
      lightImpact();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      );
    });

    it("should trigger medium impact", () => {
      mediumImpact();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Medium
      );
    });

    it("should trigger heavy impact", () => {
      heavyImpact();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Heavy
      );
    });

    it("should not trigger when disabled", () => {
      setHapticsEnabled(false);
      lightImpact();
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });
  });

  describe("Notification Feedback", () => {
    it("should trigger success notification", () => {
      success();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      );
    });

    it("should trigger warning notification", () => {
      warning();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Warning
      );
    });

    it("should trigger error notification", () => {
      error();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Error
      );
    });

    it("should not trigger when disabled", () => {
      setHapticsEnabled(false);
      success();
      expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    });
  });

  describe("Selection Feedback", () => {
    it("should trigger selection", () => {
      selection();
      expect(Haptics.selectionAsync).toHaveBeenCalled();
    });

    it("should not trigger when disabled", () => {
      setHapticsEnabled(false);
      selection();
      expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    });
  });

  describe("Predefined Patterns", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should trigger buttonPress pattern", () => {
      HapticPatterns.buttonPress();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      );
    });

    it("should trigger primaryAction pattern", () => {
      HapticPatterns.primaryAction();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Medium
      );
    });

    it("should trigger actionSuccess pattern", () => {
      HapticPatterns.actionSuccess();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      );
    });

    it("should trigger actionError pattern", () => {
      HapticPatterns.actionError();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Error
      );
    });

    it("should trigger actionWarning pattern", () => {
      HapticPatterns.actionWarning();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Warning
      );
    });

    it("should trigger tabSwitch pattern", () => {
      HapticPatterns.tabSwitch();
      expect(Haptics.selectionAsync).toHaveBeenCalled();
    });

    it("should trigger pullToRefresh pattern", () => {
      HapticPatterns.pullToRefresh();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Medium
      );
    });

    it("should trigger longPressMenu pattern", () => {
      HapticPatterns.longPressMenu();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Medium
      );
    });

    it("should trigger scrollToTop pattern", () => {
      HapticPatterns.scrollToTop();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      );
    });

    it("should trigger delete pattern with warning", () => {
      HapticPatterns.delete();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Warning
      );
    });

    it("should trigger save pattern with success", () => {
      HapticPatterns.save();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      );
    });

    it("should trigger toggle pattern with selection", () => {
      HapticPatterns.toggle();
      expect(Haptics.selectionAsync).toHaveBeenCalled();
    });

    it("should trigger stepperChange pattern with selection", () => {
      HapticPatterns.stepperChange();
      expect(Haptics.selectionAsync).toHaveBeenCalled();
    });

    it("should trigger achievement pattern with double success", () => {
      HapticPatterns.achievement();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      );

      jest.advanceTimersByTime(100);

      expect(Haptics.notificationAsync).toHaveBeenCalledTimes(2);
    });

    it("should trigger errorShake pattern with multiple feedbacks", () => {
      HapticPatterns.errorShake();

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Error
      );

      jest.advanceTimersByTime(100);

      expect(Haptics.notificationAsync).toHaveBeenCalledTimes(2);
    });

    it("should not trigger patterns when disabled", () => {
      setHapticsEnabled(false);
      HapticPatterns.buttonPress();
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });
  });

  describe("Default Export", () => {
    it("should export setEnabled function", () => {
      expect(haptics.setEnabled).toBe(setHapticsEnabled);
    });

    it("should export isEnabled function", () => {
      expect(haptics.isEnabled).toBe(isHapticsEnabled);
    });

    it("should export feedback functions", () => {
      expect(haptics.light).toBe(lightImpact);
      expect(haptics.medium).toBe(mediumImpact);
      expect(haptics.heavy).toBe(heavyImpact);
      expect(haptics.success).toBe(success);
      expect(haptics.warning).toBe(warning);
      expect(haptics.error).toBe(error);
      expect(haptics.selection).toBe(selection);
    });

    it("should export patterns", () => {
      expect(haptics.patterns).toBe(HapticPatterns);
    });
  });
});
