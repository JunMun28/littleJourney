/**
 * Icon Component
 *
 * A wrapper around lucide-react-native icons for consistent sizing and theming.
 */

import { type LucideIcon, type LucideProps } from "lucide-react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemeColors, IconSize } from "@/constants/design-tokens";

type IconSizeName = keyof typeof IconSize;

interface IconProps extends Omit<LucideProps, "size"> {
  /** The Lucide icon component to render */
  icon: LucideIcon;
  /** Size preset or number */
  size?: IconSizeName | number;
  /** Custom color (overrides theme) */
  color?: string;
  /** Use muted color variant */
  muted?: boolean;
}

export function Icon({
  icon: IconComponent,
  size = "md",
  color,
  muted = false,
  ...rest
}: IconProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];

  const iconSize = typeof size === "number" ? size : IconSize[size];
  const iconColor = color ?? (muted ? colors.iconMuted : colors.icon);

  return <IconComponent size={iconSize} color={iconColor} {...rest} />;
}
