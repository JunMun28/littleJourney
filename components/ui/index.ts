/**
 * UI Component Library for Little Journey
 *
 * Export all reusable UI components from a single entry point.
 */

// Core components
export { Button } from "./button";
export { Card, CardHeader, CardFooter } from "./card";
export { FAB } from "./fab";
export { ProgressBar, CircularProgress } from "./progress-bar";
export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonFeed,
  SkeletonStatCard,
} from "./skeleton";

// Icon component
export { Icon } from "./icon";

// Toast notifications
export { ToastProvider, useToast } from "./toast";

// Avatar components
export { Avatar, AvatarGroup } from "./avatar";

// Badge component
export { Badge } from "./badge";

// Chip components
export { Chip, ChipGroup } from "./chip";

// TextInput component
export { TextInput } from "./text-input";

// ListItem component
export { ListItem } from "./list-item";

// EmptyState component
export { EmptyState } from "./empty-state";

// BottomSheet component
export { BottomSheet, type BottomSheetRef } from "./bottom-sheet";

// Confetti celebration effect
export { Confetti, useConfetti } from "./confetti";

// Modal components
export { ModalHeader, type ModalHeaderProps } from "./modal-header";

// Form components
export { SwitchRow, type SwitchRowProps } from "./switch-row";
export {
  SegmentedControl,
  type SegmentedControlProps,
  type SegmentOption,
} from "./segmented-control";

// Layout components
export { Divider, type DividerProps } from "./divider";

// Existing components
export { default as Collapsible } from "./collapsible";
export { IconSymbol, type IconSymbolName } from "./icon-symbol";
