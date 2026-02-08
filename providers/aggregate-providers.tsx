import { type ReactNode } from "react";

import { GamificationProvider } from "@/contexts/gamification-context";
import { CommunityProvider } from "@/contexts/community-context";
import { RedPacketProvider } from "@/contexts/red-packet-context";
import { FamilyDigestProvider } from "@/contexts/family-digest-context";
import { YearInReviewProvider } from "@/contexts/year-in-review-context";
import { ExportProvider } from "@/contexts/export-context";
import { PhotoBookProvider } from "@/contexts/photo-book-context";
import { ProviderComposer } from "@/utils/compose-providers";

interface AggregateProvidersProps {
  children: ReactNode;
}

// Feature providers for gamification and content generation
// Ordered by dependency: gamification data feeds into community and reports
const AGGREGATE_PROVIDERS = [
  GamificationProvider,
  CommunityProvider,
  RedPacketProvider,
  FamilyDigestProvider,
  YearInReviewProvider,
  ExportProvider,
  PhotoBookProvider,
] as const;

export function AggregateProviders({ children }: AggregateProvidersProps) {
  return (
    <ProviderComposer providers={[...AGGREGATE_PROVIDERS]}>
      {children}
    </ProviderComposer>
  );
}
