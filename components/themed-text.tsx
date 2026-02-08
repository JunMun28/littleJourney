import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Typography, FontSize, LineHeight, FontWeight } from '@/constants/design-tokens';

export type TextType = 
  // Existing types (maintaining backward compatibility)
  | 'default' 
  | 'title' 
  | 'defaultSemiBold' 
  | 'subtitle' 
  | 'link'
  // New typography hierarchy
  | 'hero'        // 40px bold - Onboarding titles
  | 'heading'     // 26px semibold - Section headers
  | 'subheading'  // 22px semibold - Card titles
  | 'body'        // 17px regular - Body text (default)
  | 'bodyMedium'  // 17px medium - Emphasized body
  | 'bodySemibold'// 17px semibold - Strong emphasis
  | 'caption'     // 13px regular - Metadata
  | 'label';      // 11px medium uppercase - Tags

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: TextType;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        styles.base,
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'defaultSemiBold' && styles.defaultSemiBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        // New types
        type === 'hero' && styles.hero,
        type === 'heading' && styles.heading,
        type === 'subheading' && styles.subheading,
        type === 'body' && styles.body,
        type === 'bodyMedium' && styles.bodyMedium,
        type === 'bodySemibold' && styles.bodySemibold,
        type === 'caption' && styles.caption,
        type === 'label' && styles.label,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    // Ensure consistent font rendering
    fontFamily: Typography.body.fontFamily,
  },
  
  // Legacy types (for backward compatibility)
  default: {
    fontSize: FontSize.base,
    lineHeight: FontSize.base * LineHeight.normal,
  },
  defaultSemiBold: {
    fontSize: FontSize.base,
    lineHeight: FontSize.base * LineHeight.normal,
    fontWeight: FontWeight.semibold,
  },
  title: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['3xl'] * LineHeight.tight,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.xl * LineHeight.snug,
  },
  link: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.base * LineHeight.normal,
    color: '#0a7ea4',
  },
  
  // New typography hierarchy
  hero: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['4xl'] * LineHeight.tight,
    letterSpacing: -0.5,
  },
  heading: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize['2xl'] * LineHeight.snug,
  },
  subheading: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.xl * LineHeight.snug,
  },
  body: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.normal,
    lineHeight: FontSize.base * LineHeight.normal,
  },
  bodyMedium: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.base * LineHeight.normal,
  },
  bodySemibold: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.base * LineHeight.normal,
  },
  caption: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.normal,
    lineHeight: FontSize.sm * LineHeight.normal,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.xs * LineHeight.normal,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
