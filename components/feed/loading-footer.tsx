import { View, ActivityIndicator, StyleSheet } from "react-native";

import { PRIMARY_COLOR } from "@/constants/theme";

interface LoadingFooterProps {
  isLoading: boolean;
}

export function LoadingFooter({ isLoading }: LoadingFooterProps) {
  if (!isLoading) return null;

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={PRIMARY_COLOR} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
