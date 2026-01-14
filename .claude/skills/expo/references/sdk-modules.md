# Expo SDK Common Modules

## Installation Pattern

Always use `expo install` for compatible versions:
```bash
npx expo install expo-camera expo-location expo-notifications
```

## Camera

```bash
npx expo install expo-camera
```

```tsx
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function Camera() {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View>
        <Text>We need camera permission</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <CameraView style={{ flex: 1 }} facing="back">
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={takePicture}>
          <Text>Take Photo</Text>
        </TouchableOpacity>
      </View>
    </CameraView>
  );
}
```

## Image Picker

```bash
npx expo install expo-image-picker
```

```tsx
import * as ImagePicker from 'expo-image-picker';

async function pickImage() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (!result.canceled) {
    setImage(result.assets[0].uri);
  }
}

async function takePhoto() {
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (!result.canceled) {
    setImage(result.assets[0].uri);
  }
}
```

## Location

```bash
npx expo install expo-location
```

```tsx
import * as Location from 'expo-location';

async function getLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.log('Permission denied');
    return;
  }

  const location = await Location.getCurrentPositionAsync({});
  console.log(location.coords.latitude, location.coords.longitude);
}

// Watch position
useEffect(() => {
  let subscription: Location.LocationSubscription;
  
  (async () => {
    subscription = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 1000 },
      (location) => setLocation(location)
    );
  })();

  return () => subscription?.remove();
}, []);
```

## Notifications

```bash
npx expo install expo-notifications expo-device expo-constants
```

```tsx
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotifications() {
  if (!Device.isDevice) {
    alert('Push notifications require a physical device');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token');
    return;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  console.log('Push token:', token.data);
  return token.data;
}

// Schedule local notification
async function scheduleNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Reminder',
      body: 'This is a scheduled notification',
      data: { screen: 'home' },
    },
    trigger: { seconds: 5 },
  });
}
```

## Secure Store

```bash
npx expo install expo-secure-store
```

```tsx
import * as SecureStore from 'expo-secure-store';

async function saveToken(key: string, value: string) {
  await SecureStore.setItemAsync(key, value);
}

async function getToken(key: string) {
  return await SecureStore.getItemAsync(key);
}

async function deleteToken(key: string) {
  await SecureStore.deleteItemAsync(key);
}
```

## AsyncStorage (Third-party, commonly used)

```bash
npx expo install @react-native-async-storage/async-storage
```

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

async function storeData(key: string, value: object) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function getData(key: string) {
  const value = await AsyncStorage.getItem(key);
  return value ? JSON.parse(value) : null;
}

async function removeData(key: string) {
  await AsyncStorage.removeItem(key);
}
```

## File System

```bash
npx expo install expo-file-system
```

```tsx
import * as FileSystem from 'expo-file-system';

// Read file
const content = await FileSystem.readAsStringAsync(
  FileSystem.documentDirectory + 'data.json'
);

// Write file
await FileSystem.writeAsStringAsync(
  FileSystem.documentDirectory + 'data.json',
  JSON.stringify(data)
);

// Download file
const download = FileSystem.createDownloadResumable(
  'https://example.com/image.jpg',
  FileSystem.documentDirectory + 'image.jpg',
  {},
  (progress) => {
    const percent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
    console.log(`${Math.round(percent * 100)}%`);
  }
);
const { uri } = await download.downloadAsync();
```

## SQLite

```bash
npx expo install expo-sqlite
```

```tsx
import * as SQLite from 'expo-sqlite';

const db = await SQLite.openDatabaseAsync('mydb.db');

// Create table
await db.execAsync(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    email TEXT
  );
`);

// Insert
await db.runAsync('INSERT INTO users (name, email) VALUES (?, ?)', ['John', 'john@example.com']);

// Query
const users = await db.getAllAsync('SELECT * FROM users');

// Query with params
const user = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', [1]);
```

## Haptics

```bash
npx expo install expo-haptics
```

```tsx
import * as Haptics from 'expo-haptics';

// Impact feedback
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Notification feedback
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

// Selection feedback
Haptics.selectionAsync();
```

## Constants

```bash
npx expo install expo-constants
```

```tsx
import Constants from 'expo-constants';

// App config values
const appName = Constants.expoConfig?.name;
const appVersion = Constants.expoConfig?.version;
const extra = Constants.expoConfig?.extra;

// Device info
const deviceName = Constants.deviceName;
const isDevice = Constants.isDevice;

// Platform
const platform = Constants.platform; // { ios: {...} } or { android: {...} }
```

## Splash Screen

```bash
npx expo install expo-splash-screen
```

```tsx
import * as SplashScreen from 'expo-splash-screen';

// Prevent auto-hide
SplashScreen.preventAutoHideAsync();

// In your root component
export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      // Load fonts, make API calls, etc.
      await Font.loadAsync({ ... });
      setAppIsReady(true);
    }
    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) return null;
  return <App />;
}
```

## Fonts

```bash
npx expo install expo-font
```

```tsx
import { useFonts } from 'expo-font';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <Text style={{ fontFamily: 'Inter-Bold' }}>Hello</Text>
  );
}
```

## Linear Gradient

```bash
npx expo install expo-linear-gradient
```

```tsx
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={['#4c669f', '#3b5998', '#192f6a']}
  style={styles.gradient}
>
  <Text>Gradient Background</Text>
</LinearGradient>
```

## Blur View

```bash
npx expo install expo-blur
```

```tsx
import { BlurView } from 'expo-blur';

<BlurView intensity={50} style={styles.blur}>
  <Text>Blurred content</Text>
</BlurView>
```

## Web Browser

```bash
npx expo install expo-web-browser
```

```tsx
import * as WebBrowser from 'expo-web-browser';

async function openBrowser() {
  await WebBrowser.openBrowserAsync('https://expo.dev');
}

// For OAuth flows
WebBrowser.maybeCompleteAuthSession();
```

## Linking

```tsx
import { Linking } from 'react-native';
import * as ExpoLinking from 'expo-linking';

// Open URL
await Linking.openURL('https://expo.dev');

// Open settings
await Linking.openSettings();

// Create deep link URL
const url = ExpoLinking.createURL('path/to/screen', {
  queryParams: { id: '123' },
});
```
