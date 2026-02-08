import { type ReactNode } from "react";

import { AuthProvider } from "@/contexts/auth-context";
import { UserPreferencesProvider } from "@/contexts/user-preferences-context";
import { ViewerProvider } from "@/contexts/viewer-context";

interface AuthProvidersProps {
  children: ReactNode;
}

export function AuthProviders({ children }: AuthProvidersProps) {
  return (
    <AuthProvider>
      <UserPreferencesProvider>
        <ViewerProvider>{children}</ViewerProvider>
      </UserPreferencesProvider>
    </AuthProvider>
  );
}
