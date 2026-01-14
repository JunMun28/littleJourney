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
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PhotoCarousel } from "@/components/photo-carousel";
import { VideoPlayer } from "@/components/video-player";
import {
  useEntries,
  type Entry,
  type EntryType,
} from "@/contexts/entry-context";
import { useChild } from "@/contexts/child-context";
import { useStorage } from "@/contexts/storage-context";

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
  onPress: () => void;
}

function EntryCard({ entry, onPress }: EntryCardProps) {
  const formattedDate = new Date(entry.date).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Pressable onPress={onPress} style={styles.card}>
      {entry.type === "photo" &&
        entry.mediaUris &&
        entry.mediaUris.length > 0 && (
          <PhotoCarousel images={entry.mediaUris} onImagePress={onPress} />
        )}
      {entry.type === "video" &&
        entry.mediaUris &&
        entry.mediaUris.length > 0 && (
          <VideoPlayer
            uri={entry.mediaUris[0]}
            onPress={onPress}
            showControls={true}
          />
        )}
      {entry.caption && (
        <ThemedText style={styles.cardCaption}>{entry.caption}</ThemedText>
      )}
      <ThemedText style={styles.cardDate}>{formattedDate}</ThemedText>
    </Pressable>
  );
}

type CreateStep = "type" | "media" | "caption";

export default function FeedScreen() {
  const { entries, addEntry } = useEntries();
  const { child } = useChild();
  const { canUpload, canUploadVideo, addUsage, tier } = useStorage();

  const [refreshing, setRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>("type");
  const [selectedType, setSelectedType] = useState<EntryType | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [selectedMediaSizes, setSelectedMediaSizes] = useState<number[]>([]);
  const [caption, setCaption] = useState("");

  const resetCreation = () => {
    setIsCreating(false);
    setCreateStep("type");
    setSelectedType(null);
    setSelectedMedia([]);
    setSelectedMediaSizes([]);
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
    } else if (type === "video") {
      // Check video permission for tier first
      if (tier === "free") {
        Alert.alert(
          "Video Not Available",
          "Video uploads are available on Standard and Premium plans. Upgrade to start capturing video moments!",
          [{ text: "OK" }],
        );
        setSelectedType(null);
        return;
      }

      // Request permission and open picker
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access media library is required.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const video = result.assets[0];
        const duration = video.duration ? video.duration / 1000 : 0; // ms to seconds
        const fileSize = video.fileSize ?? 0;

        // Check video duration limit
        if (!canUploadVideo(duration)) {
          const maxMinutes = tier === "standard" ? 2 : 10;
          Alert.alert(
            "Video Too Long",
            `Your ${tier} plan allows videos up to ${maxMinutes} minutes. This video is ${Math.ceil(duration / 60)} minutes.`,
            [{ text: "OK" }],
          );
          return;
        }

        // Check storage limit
        if (!canUpload(fileSize)) {
          Alert.alert(
            "Storage Limit Reached",
            "You don't have enough storage space for this video. Please upgrade your plan or free up space.",
            [{ text: "OK" }],
          );
          return;
        }

        setSelectedMedia([video.uri]);
        setSelectedMediaSizes([fileSize]);
        setCreateStep("caption");
      }
    } else {
      // Photo flow
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access media library is required.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const totalSize = result.assets.reduce(
          (sum, a) => sum + (a.fileSize ?? 0),
          0,
        );

        // Check storage limit
        if (!canUpload(totalSize)) {
          Alert.alert(
            "Storage Limit Reached",
            "You don't have enough storage space for these photos. Please upgrade your plan or free up space.",
            [{ text: "OK" }],
          );
          return;
        }

        setSelectedMedia(result.assets.map((a) => a.uri));
        setSelectedMediaSizes(result.assets.map((a) => a.fileSize ?? 0));
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

    // Track storage usage for uploaded media
    if (selectedMediaSizes.length > 0) {
      const totalSize = selectedMediaSizes.reduce((sum, size) => sum + size, 0);
      addUsage(totalSize);
    }

    resetCreation();
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EntryCard
            entry={item}
            onPress={() => router.push(`/entry/${item.id}`)}
          />
        )}
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
