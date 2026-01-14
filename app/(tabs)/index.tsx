import { useState, useCallback } from "react";
import {
  StyleSheet,
  FlatList,
  TouchableOpacity,
  View,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PhotoCarousel } from "@/components/photo-carousel";
import {
  useEntries,
  type Entry,
  type EntryType,
} from "@/contexts/entry-context";
import { useChild } from "@/contexts/child-context";

const PRIMARY_COLOR = "#0a7ea4";

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <ThemedText style={styles.emptyIcon}>📷</ThemedText>
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        No moments yet
      </ThemedText>
      <ThemedText style={styles.emptyText}>
        Tap the + button to add your first memory
      </ThemedText>
    </View>
  );
}

interface EntryCardProps {
  entry: Entry;
}

function EntryCard({ entry }: EntryCardProps) {
  const formattedDate = new Date(entry.date).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <View style={styles.card}>
      {entry.type === "photo" &&
        entry.mediaUris &&
        entry.mediaUris.length > 0 && (
          <PhotoCarousel images={entry.mediaUris} />
        )}
      {entry.type === "video" &&
        entry.mediaUris &&
        entry.mediaUris.length > 0 && (
          <View style={styles.videoPlaceholder}>
            <ThemedText style={styles.videoIcon}>🎬</ThemedText>
          </View>
        )}
      {entry.caption && (
        <ThemedText style={styles.cardCaption}>{entry.caption}</ThemedText>
      )}
      <ThemedText style={styles.cardDate}>{formattedDate}</ThemedText>
    </View>
  );
}

type CreateStep = "type" | "media" | "caption";

export default function FeedScreen() {
  const { entries, addEntry } = useEntries();
  const { child } = useChild();

  const [refreshing, setRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>("type");
  const [selectedType, setSelectedType] = useState<EntryType | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [caption, setCaption] = useState("");

  const resetCreation = () => {
    setIsCreating(false);
    setCreateStep("type");
    setSelectedType(null);
    setSelectedMedia([]);
    setCaption("");
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh delay - will be replaced with TanStack Query invalidation
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleTypeSelect = async (type: EntryType) => {
    setSelectedType(type);

    if (type === "text") {
      // Skip media selection for text entries
      setCreateStep("caption");
    } else {
      // Request permission and open picker
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access media library is required.");
        return;
      }

      const mediaType =
        type === "photo"
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaType,
        allowsMultipleSelection: type === "photo",
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setSelectedMedia(result.assets.map((a) => a.uri));
        setCreateStep("caption");
      }
    }
  };

  const handleSubmit = () => {
    if (!selectedType) return;

    const today = new Date().toISOString().split("T")[0];

    addEntry({
      type: selectedType,
      mediaUris: selectedMedia.length > 0 ? selectedMedia : undefined,
      caption: caption.trim() || undefined,
      date: today,
    });

    resetCreation();
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EntryCard entry={item} />}
        ListEmptyComponent={EmptyState}
        contentContainerStyle={
          entries.length === 0 ? styles.listEmpty : styles.list
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY_COLOR}
            colors={[PRIMARY_COLOR]}
          />
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsCreating(true)}
        accessibilityLabel="Add new entry"
      >
        <ThemedText style={styles.fabIcon}>+</ThemedText>
      </TouchableOpacity>

      {/* Entry Creation Modal */}
      <Modal
        visible={isCreating}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={resetCreation}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={resetCreation}>
              <ThemedText style={styles.cancelButton}>Cancel</ThemedText>
            </Pressable>
            <ThemedText type="subtitle">New Entry</ThemedText>
            <View style={{ width: 60 }} />
          </View>

          {createStep === "type" && (
            <View style={styles.typeSelection}>
              <ThemedText style={styles.stepTitle}>
                What would you like to add?
              </ThemedText>
              <View style={styles.typeOptions}>
                <TouchableOpacity
                  style={styles.typeOption}
                  onPress={() => handleTypeSelect("photo")}
                >
                  <ThemedText style={styles.typeIcon}>📷</ThemedText>
                  <ThemedText>Photo</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.typeOption}
                  onPress={() => handleTypeSelect("video")}
                >
                  <ThemedText style={styles.typeIcon}>🎬</ThemedText>
                  <ThemedText>Video</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.typeOption}
                  onPress={() => handleTypeSelect("text")}
                >
                  <ThemedText style={styles.typeIcon}>✏️</ThemedText>
                  <ThemedText>Text</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {createStep === "caption" && (
            <View style={styles.captionStep}>
              {selectedMedia.length > 0 && (
                <Image
                  source={{ uri: selectedMedia[0] }}
                  style={styles.previewImage}
                />
              )}
              <TextInput
                style={styles.captionInput}
                placeholder={`What's ${child?.nickname || child?.name || "your little one"} up to?`}
                placeholderTextColor="#999"
                value={caption}
                onChangeText={setCaption}
                multiline
                autoFocus={selectedType === "text"}
              />
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <ThemedText style={styles.submitButtonText}>Post</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  listEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.7,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(128, 128, 128, 0.1)",
  },
  videoPlaceholder: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoIcon: {
    fontSize: 48,
  },
  cardCaption: {
    padding: 12,
    paddingBottom: 4,
  },
  cardDate: {
    padding: 12,
    paddingTop: 4,
    opacity: 0.6,
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 32,
    color: "#fff",
    marginTop: -2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  cancelButton: {
    color: PRIMARY_COLOR,
    fontSize: 16,
  },
  typeSelection: {
    flex: 1,
    padding: 24,
  },
  stepTitle: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: "center",
  },
  typeOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  typeOption: {
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(128, 128, 128, 0.1)",
    minWidth: 100,
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  captionStep: {
    flex: 1,
    padding: 16,
  },
  previewImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 16,
  },
  captionInput: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: PRIMARY_COLOR,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
