// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;

/**
 * Comprehensive SF Symbols to Material Icons mapping
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING: IconMapping = {
  // Navigation
  'house.fill': 'home',
  'house': 'home',
  'star.fill': 'star',
  'star': 'star-border',
  'chart.line.uptrend.xyaxis': 'trending-up',
  'envelope.fill': 'mail',
  'envelope': 'mail-outline',
  'magnifyingglass': 'search',
  'gearshape.fill': 'settings',
  'gearshape': 'settings',
  
  // Actions
  'plus': 'add',
  'plus.circle.fill': 'add-circle',
  'plus.circle': 'add-circle-outline',
  'xmark': 'close',
  'xmark.circle.fill': 'cancel',
  'checkmark': 'check',
  'checkmark.circle.fill': 'check-circle',
  'checkmark.circle': 'check-circle-outline',
  'arrow.left': 'arrow-back',
  'arrow.right': 'arrow-forward',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'chevron.down': 'keyboard-arrow-down',
  'chevron.up': 'keyboard-arrow-up',
  
  // Media
  'photo': 'image',
  'photo.fill': 'image',
  'camera': 'camera-alt',
  'camera.fill': 'camera-alt',
  'video': 'videocam',
  'video.fill': 'videocam',
  'mic': 'mic',
  'mic.fill': 'mic',
  'play.fill': 'play-arrow',
  'pause.fill': 'pause',
  
  // Content
  'text.alignleft': 'text-fields',
  'calendar': 'calendar-today',
  'calendar.fill': 'calendar-today',
  'note.text': 'note',
  'tag': 'label',
  'tag.fill': 'label',
  
  // Social
  'person': 'person',
  'person.fill': 'person',
  'person.2': 'people',
  'person.2.fill': 'people',
  'heart': 'favorite-border',
  'heart.fill': 'favorite',
  'square.and.arrow.up': 'share',
  
  // Status
  'flame': 'whatshot',
  'flame.fill': 'whatshot',
  'trophy': 'emoji-events',
  'trophy.fill': 'emoji-events',
  'medal': 'military-tech',
  'medal.fill': 'military-tech',
  'bell': 'notifications-none',
  'bell.fill': 'notifications',
  'exclamationmark.triangle': 'warning',
  'exclamationmark.triangle.fill': 'warning',
  'info.circle': 'info',
  'info.circle.fill': 'info',
  
  // Misc
  'trash': 'delete',
  'trash.fill': 'delete',
  'pencil': 'edit',
  'doc': 'description',
  'doc.fill': 'description',
  'lock': 'lock',
  'lock.fill': 'lock',
  'moon': 'dark-mode',
  'sun.max': 'light-mode',
  'qrcode': 'qr-code',
  'barcode': 'qr-code-scanner',
  'gift': 'card-giftcard',
  'gift.fill': 'card-giftcard',
  'envelope.open': 'drafts',
  'envelope.open.fill': 'drafts',
  'clock': 'schedule',
  'clock.fill': 'schedule',
  'location': 'location-on',
  'location.fill': 'location-on',
  'map': 'map',
  'map.fill': 'map',
  
  // Development/Growth
  'ruler': 'straighten',
  'scalemass': 'fitness-center',
  'brain': 'psychology',
  'eye': 'visibility',
  'eye.fill': 'visibility',
  'ear': 'hearing',
  'hand.raised': 'back-hand',
  'figure.walk': 'directions-walk',
  'figure.run': 'directions-run',
  
  // Tab specific
  'list.bullet': 'list',
  'ellipsis': 'more-horiz',
  'arrow.clockwise': 'refresh',
  'arrow.uturn.left': 'undo',
};

export type IconSymbolName = SymbolViewProps['name'];

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  // Get the Material Icon name, fallback to 'help-outline' if not mapped
  const materialName = MAPPING[name] || 'help-outline';
  
  return <MaterialIcons color={color} size={size} name={materialName} style={style} />;
}
