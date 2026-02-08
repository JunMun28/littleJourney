import { type ReactNode } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import { QueryProvider } from "@/providers/query-provider";
import { AppStateProvider } from "@/providers/app-state-provider";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface CoreProvidersProps {
  children: ReactNode;
}

export function CoreProviders({ children }: CoreProvidersProps) {
  const colorScheme = useColorScheme();

  return (
    <QueryProvider>
      <AppStateProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          {children}
        </ThemeProvider>
      </AppStateProvider>
    </QueryProvider>
  );
}
