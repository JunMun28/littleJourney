import { type ReactNode } from "react";

import { ChildProvider } from "@/contexts/child-context";
import { EntryProvider } from "@/contexts/entry-context";
import { FamilyProvider } from "@/contexts/family-context";
import { MilestoneProvider } from "@/contexts/milestone-context";
import { ProviderComposer } from "@/utils/compose-providers";

interface DataProvidersProps {
  children: ReactNode;
}

// Core data providers for primary app entities
// Ordered by dependency: child context needed for entries and milestones
const DATA_PROVIDERS = [
  ChildProvider,
  EntryProvider,
  FamilyProvider,
  MilestoneProvider,
] as const;

export function DataProviders({ children }: DataProvidersProps) {
  return (
    <ProviderComposer providers={[...DATA_PROVIDERS]}>
      {children}
    </ProviderComposer>
  );
}
