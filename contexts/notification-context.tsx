import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSettings {
  dailyPrompt: boolean;
  memories: boolean;
  milestoneReminder: boolean;
  familyActivity: boolean;
  storageWarning: boolean;
}

type PermissionStatus = "granted" | "denied" | "undetermined";

// Smart frequency types (PRD Section 7.3)
export type PromptFrequency = "daily" | "every_2_days" | "weekly";

interface NotificationContextValue {
  settings: NotificationSettings;
  updateSettings: (updates: Partial<NotificationSettings>) => void;
  permissionStatus: PermissionStatus;
  requestPermissions: () => Promise<PermissionStatus>;
  expoPushToken: string | null;
  scheduleDailyPrompt: (time: string) => Promise<void>;
  cancelDailyPrompt: () => Promise<void>;
  // On This Day memories (PRD Section 4.5)
  sendMemoriesNotification: (memoriesCount: number) => Promise<void>;
  // Milestone reminders (PRD Section 7.1)
  scheduleMilestoneReminder: (
    milestoneId: string,
    title: string,
    milestoneDate: string,
    daysBefore: number,
  ) => Promise<void>;
  cancelMilestoneReminder: (milestoneId: string) => Promise<void>;
  // Smart frequency (PRD Section 7.3)
  promptFrequency: PromptFrequency;
  consecutiveIgnoredDays: number;
  recordIgnoredPrompt: () => void;
  recordEntryPosted: () => void;
  getScheduleInterval: () => number;
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

const DEFAULT_SETTINGS: NotificationSettings = {
  dailyPrompt: true,
  memories: true,
  milestoneReminder: true,
  familyActivity: true,
  storageWarning: true,
};

interface NotificationProviderProps {
  children: ReactNode;
}

// Helper to calculate frequency from ignored days (PRD Section 7.3)
function calculateFrequency(ignoredDays: number): PromptFrequency {
  if (ignoredDays >= 7) return "weekly";
  if (ignoredDays >= 3) return "every_2_days";
  return "daily";
}

// Helper to get interval days from frequency
function getIntervalFromFrequency(frequency: PromptFrequency): number {
  switch (frequency) {
    case "weekly":
      return 7;
    case "every_2_days":
      return 2;
    case "daily":
    default:
      return 1;
  }
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [settings, setSettings] =
    useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>("undetermined");
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  // Smart frequency state (PRD Section 7.3)
  const [consecutiveIgnoredDays, setConsecutiveIgnoredDays] = useState(0);
  const [promptFrequency, setPromptFrequency] =
    useState<PromptFrequency>("daily");

  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null,
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Set up notification listeners
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        // Handle notification received while app is foregrounded
        console.log("Notification received:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        // Handle notification tap
        console.log("Notification response:", response);
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const updateSettings = useCallback(
    (updates: Partial<NotificationSettings>) => {
      setSettings((prev) => ({ ...prev, ...updates }));
      // TODO: Persist to backend/storage
    },
    [],
  );

  const requestPermissions =
    useCallback(async (): Promise<PermissionStatus> => {
      if (!Device.isDevice) {
        console.warn("Push notifications require a physical device");
        return "denied";
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const mappedStatus: PermissionStatus =
        finalStatus === "granted" ? "granted" : "denied";
      setPermissionStatus(mappedStatus);

      if (finalStatus === "granted") {
        // Get push token
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: undefined, // Uses app.json projectId
        });
        setExpoPushToken(tokenData.data);

        // Android requires notification channel
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#0a7ea4",
          });
        }
      }

      return mappedStatus;
    }, []);

  const scheduleDailyPrompt = useCallback(
    async (time: string) => {
      // Cancel existing prompts first
      await Notifications.cancelAllScheduledNotificationsAsync();

      const interval = getIntervalFromFrequency(promptFrequency);

      if (interval === 1) {
        // Daily: use DAILY trigger at specific time
        const [hours, minutes] = time.split(":").map(Number);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Time to capture a moment! 📸",
            body: "What special moment happened today? Add it to your journal.",
            data: { type: "daily_prompt" },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: hours,
            minute: minutes,
          },
        });
      } else {
        // Reduced frequency: use TIME_INTERVAL trigger
        // Note: TIME_INTERVAL doesn't support specific time of day,
        // so we calculate seconds from first trigger at target time
        const intervalSeconds = interval * 24 * 60 * 60; // days to seconds

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Time to capture a moment! 📸",
            body: "What special moment happened today? Add it to your journal.",
            data: { type: "daily_prompt" },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: intervalSeconds,
            repeats: true,
          },
        });
      }
    },
    [promptFrequency],
  );

  const cancelDailyPrompt = useCallback(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }, []);

  // On This Day memories notification (PRD Section 4.5)
  const sendMemoriesNotification = useCallback(
    async (memoriesCount: number) => {
      // Skip if no memories or memories notifications disabled
      if (memoriesCount === 0 || !settings.memories) {
        return;
      }

      const memoriesWord = memoriesCount === 1 ? "memory" : "memories";
      const yearsWord = memoriesCount === 1 ? "year" : "years";

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `📸 ${memoriesCount} ${memoriesWord} from previous ${yearsWord}!`,
          body: "Take a trip down memory lane and see what happened on this day.",
          data: { type: "memories" },
        },
        trigger: null, // Send immediately
      });
    },
    [settings.memories],
  );

  // Milestone reminder methods (PRD Section 7.1)
  const scheduleMilestoneReminder = useCallback(
    async (
      milestoneId: string,
      title: string,
      milestoneDate: string,
      daysBefore: number,
    ) => {
      // Skip if milestone reminders are disabled
      if (!settings.milestoneReminder) {
        return;
      }

      // Parse milestone date and calculate trigger date
      const milestone = new Date(milestoneDate);
      const triggerDate = new Date(milestone);
      triggerDate.setDate(triggerDate.getDate() - daysBefore);

      // Don't schedule if trigger date is in the past
      if (triggerDate <= new Date()) {
        return;
      }

      // Calculate seconds until trigger
      const secondsUntilTrigger = Math.floor(
        (triggerDate.getTime() - Date.now()) / 1000,
      );

      await Notifications.scheduleNotificationAsync({
        identifier: `milestone-reminder-${milestoneId}`,
        content: {
          title: `🎉 ${title} is coming up!`,
          body: `${daysBefore} day${daysBefore === 1 ? "" : "s"} until this special milestone.`,
          data: { type: "milestone_reminder", milestoneId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilTrigger,
        },
      });
    },
    [settings.milestoneReminder],
  );

  const cancelMilestoneReminder = useCallback(async (milestoneId: string) => {
    await Notifications.cancelScheduledNotificationAsync(
      `milestone-reminder-${milestoneId}`,
    );
  }, []);

  // Smart frequency methods (PRD Section 7.3)
  const recordIgnoredPrompt = useCallback(() => {
    setConsecutiveIgnoredDays((prev) => {
      const newCount = prev + 1;
      setPromptFrequency(calculateFrequency(newCount));
      return newCount;
    });
  }, []);

  const recordEntryPosted = useCallback(() => {
    // Reset to daily when user posts an entry
    setConsecutiveIgnoredDays(0);
    setPromptFrequency("daily");
  }, []);

  const getScheduleInterval = useCallback(() => {
    return getIntervalFromFrequency(promptFrequency);
  }, [promptFrequency]);

  const value: NotificationContextValue = {
    settings,
    updateSettings,
    permissionStatus,
    requestPermissions,
    expoPushToken,
    scheduleDailyPrompt,
    cancelDailyPrompt,
    // On This Day memories
    sendMemoriesNotification,
    // Milestone reminders
    scheduleMilestoneReminder,
    cancelMilestoneReminder,
    // Smart frequency
    promptFrequency,
    consecutiveIgnoredDays,
    recordIgnoredPrompt,
    recordEntryPosted,
    getScheduleInterval,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (context === null) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
