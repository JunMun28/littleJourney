# Screen Templates

Production-ready screen designs with distinctive aesthetics.

## Onboarding Screen - Luxury Editorial

```tsx
import { View, Text, Image, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(40);
  const subtitleOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.8);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // Staggered entrance
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    titleTranslateY.value = withDelay(300, withSpring(0, { damping: 20 }));
    subtitleOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    buttonOpacity.value = withDelay(900, withTiming(1, { duration: 500 }));
    buttonScale.value = withDelay(900, withSpring(1, { damping: 12 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-...' }}
        style={styles.backgroundImage}
      />
      <LinearGradient
        colors={['transparent', 'rgba(15, 12, 10, 0.4)', 'rgba(15, 12, 10, 0.95)']}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>WELCOME TO</Text>
        </View>
        
        <Animated.View style={titleStyle}>
          <Text style={styles.title}>Little{'\n'}Journey</Text>
        </Animated.View>
        
        <Animated.Text style={[styles.subtitle, subtitleStyle]}>
          Capture every precious moment of your baby's first year
        </Animated.Text>
        
        <Animated.View style={[styles.buttonContainer, buttonStyle]}>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Begin Your Journey</Text>
          </Pressable>
          
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0C0A',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width,
    height,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 16,
  },
  eyebrow: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 11,
    letterSpacing: 3,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 56,
    lineHeight: 62,
    color: '#FFFAF5',
    marginBottom: 20,
  },
  subtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: 18,
    lineHeight: 28,
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 48,
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#C4642A',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 100,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 16,
    color: '#FFFAF5',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
```

## Home Feed - Modern Card Layout

```tsx
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function HomeFeedScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>Sarah</Text>
          </View>
          <Pressable style={styles.avatarContainer}>
            <Image source={{ uri: '...' }} style={styles.avatar} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        {/* Featured Card */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Pressable style={styles.featuredCard}>
            <Image source={{ uri: '...' }} style={styles.featuredImage} />
            <BlurView intensity={80} tint="dark" style={styles.featuredOverlay}>
              <Text style={styles.featuredLabel}>TODAY'S MILESTONE</Text>
              <Text style={styles.featuredTitle}>First Steps! 🎉</Text>
              <Text style={styles.featuredSubtitle}>
                Emma took her first steps today
              </Text>
            </BlurView>
          </Pressable>
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {[
            { icon: '📸', label: 'Photo', color: '#FFE4CC' },
            { icon: '📝', label: 'Note', color: '#E4F0FF' },
            { icon: '📏', label: 'Growth', color: '#E8FFE4' },
            { icon: '💉', label: 'Health', color: '#FFE4E8' },
          ].map((action, index) => (
            <Animated.View
              key={action.label}
              entering={FadeInDown.delay(200 + index * 50).springify()}
            >
              <Pressable style={[styles.actionButton, { backgroundColor: action.color }]}>
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Timeline Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Memories</Text>
            <Pressable>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          
          {memories.map((memory, index) => (
            <Animated.View
              key={memory.id}
              entering={FadeInDown.delay(400 + index * 100).springify()}
            >
              <MemoryCard {...memory} />
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const MemoryCard = ({ image, title, date, type }) => (
  <Pressable style={styles.memoryCard}>
    <Image source={{ uri: image }} style={styles.memoryImage} />
    <View style={styles.memoryContent}>
      <Text style={styles.memoryType}>{type}</Text>
      <Text style={styles.memoryTitle}>{title}</Text>
      <Text style={styles.memoryDate}>{date}</Text>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFAF7',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: '#8B7355',
  },
  userName: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: '#2C1810',
    marginTop: 2,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#C4642A',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#C4642A',
    borderWidth: 2,
    borderColor: '#FDFAF7',
  },
  featuredCard: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 24,
    height: 220,
  },
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  featuredLabel: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  featuredTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: '#fff',
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionButton: {
    width: 76,
    height: 88,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionLabel: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 12,
    color: '#2C1810',
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 20,
    color: '#2C1810',
  },
  seeAll: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 13,
    color: '#C4642A',
  },
  memoryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  memoryImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  memoryContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  memoryType: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 10,
    letterSpacing: 1.5,
    color: '#C4642A',
    textTransform: 'uppercase',
  },
  memoryTitle: {
    fontFamily: 'Lato_600SemiBold',
    fontSize: 16,
    color: '#2C1810',
    marginTop: 4,
  },
  memoryDate: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: '#8B7355',
    marginTop: 4,
  },
});
```

## Profile Screen - Dark Moody Theme

```tsx
import { View, Text, ScrollView, Image, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      {/* Ambient glow */}
      <View style={styles.glowContainer}>
        <View style={[styles.glow, { backgroundColor: '#6366F1' }]} />
        <View style={[styles.glow, styles.glowSecondary, { backgroundColor: '#F472B6' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.profileHeader}>
          <View style={styles.avatarRing}>
            <LinearGradient
              colors={['#6366F1', '#F472B6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <Image source={{ uri: '...' }} style={styles.profileAvatar} />
            </LinearGradient>
          </View>
          <Text style={styles.profileName}>Sarah Chen</Text>
          <Text style={styles.profileBio}>Documenting Emma's adventures ✨</Text>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.statsContainer}>
          <BlurView intensity={40} tint="dark" style={styles.statsBlur}>
            {[
              { value: '247', label: 'Memories' },
              { value: '12', label: 'Milestones' },
              { value: '8mo', label: 'Journey' },
            ].map((stat, i) => (
              <View key={stat.label} style={styles.stat}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </BlurView>
        </Animated.View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {[
            { icon: '⚙️', label: 'Settings', chevron: true },
            { icon: '👶', label: 'Baby Profile', chevron: true },
            { icon: '🔔', label: 'Notifications', badge: '3' },
            { icon: '☁️', label: 'Backup & Sync', chevron: true },
            { icon: '💝', label: 'Premium', special: true },
          ].map((item, index) => (
            <Animated.View
              key={item.label}
              entering={FadeInUp.delay(300 + index * 50)}
            >
              <Pressable style={[
                styles.menuItem,
                item.special && styles.menuItemSpecial
              ]}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={[
                  styles.menuLabel,
                  item.special && styles.menuLabelSpecial
                ]}>{item.label}</Text>
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                {item.chevron && (
                  <Text style={styles.chevron}>›</Text>
                )}
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.15,
    top: -50,
    left: -50,
  },
  glowSecondary: {
    top: 100,
    left: 150,
    opacity: 0.1,
  },
  content: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarRing: {
    marginBottom: 20,
  },
  avatarGradient: {
    width: 108,
    height: 108,
    borderRadius: 54,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#0A0A0B',
  },
  profileName: {
    fontFamily: 'ClashDisplay_600SemiBold',
    fontSize: 28,
    color: '#FAFAFA',
    marginBottom: 8,
  },
  profileBio: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: '#A1A1AA',
  },
  statsContainer: {
    marginBottom: 40,
  },
  statsBlur: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'ClashDisplay_700Bold',
    fontSize: 28,
    color: '#FAFAFA',
  },
  statLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: '#71717A',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuSection: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141416',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  menuItemSpecial: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: '#FAFAFA',
  },
  menuLabelSpecial: {
    color: '#A5B4FC',
  },
  badge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    color: '#fff',
  },
  chevron: {
    fontSize: 24,
    color: '#52525B',
  },
});
```

## Empty State - Playful

```tsx
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useEffect } from 'react';

export default function EmptyState({ title, message, actionLabel, onAction }) {
  const bounce = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 500 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      true
    );
    rotate.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1000 }),
        withTiming(5, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounce.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.icon, iconStyle]}>📷</Animated.Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable style={styles.button} onPress={onAction}>
        <Text style={styles.buttonText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  icon: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 24,
    color: '#2C1810',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontFamily: 'Quicksand_500Medium',
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#FF9F7A',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 100,
  },
  buttonText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#fff',
  },
});
```
