import { type ReactNode } from "react";

import { NotificationProvider } from "@/contexts/notification-context";
import { StorageProvider } from "@/contexts/storage-context";
import { SubscriptionProvider } from "@/contexts/subscription-context";
import { StripeProvider } from "@/providers/stripe-provider";
import { GrowthTrackingProvider } from "@/contexts/growth-tracking-context";
import { TimeCapsuleProvider } from "@/contexts/time-capsule-context";
import { OnThisDayProvider } from "@/contexts/on-this-day-context";
import { VoiceJournalProvider } from "@/contexts/voice-journal-context";
import { ProviderComposer } from "@/utils/compose-providers";

interface FeatureProvidersProps {
  children: ReactNode;
}

// Feature providers for core app functionality
// Ordered by dependency: storage/subscription needed for tier-gated features
const FEATURE_PROVIDERS = [
  NotificationProvider,
  StorageProvider,
  SubscriptionProvider,
  StripeProvider,
  GrowthTrackingProvider,
  TimeCapsuleProvider,
  OnThisDayProvider,
  VoiceJournalProvider,
] as const;

export function FeatureProviders({ children }: FeatureProvidersProps) {
  return (
    <ProviderComposer providers={[...FEATURE_PROVIDERS]}>
      {children}
    </ProviderComposer>
  );
}
