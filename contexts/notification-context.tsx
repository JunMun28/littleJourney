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

interface NotificationContextValue {
  settings: NotificationSettings;
  updateSettings: (updates: Partial<NotificationSettings>) => void;
  permissionStatus: PermissionStatus;
  requestPermissions: () => Promise<PermissionStatus>;
  expoPushToken: string | null;
  scheduleDailyPrompt: (time: string) => Promise<void>;
  cancelDailyPrompt: () => Promise<void>;
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

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [settings, setSettings] =
    useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>("undetermined");
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

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

  const scheduleDailyPrompt = useCallback(async (time: string) => {
    // Cancel existing daily prompts first
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Parse time string "HH:mm"
    const [hours, minutes] = time.split(":").map(Number);

    // Schedule daily notification
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
  }, []);

  const cancelDailyPrompt = useCallback(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }, []);

  const value: NotificationContextValue = {
    settings,
    updateSettings,
    permissionStatus,
    requestPermissions,
    expoPushToken,
    scheduleDailyPrompt,
    cancelDailyPrompt,
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
