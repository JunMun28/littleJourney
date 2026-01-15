import { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { VideoPlayer } from "@/components/video-player";
import { useEntry, useUpdateEntry, useDeleteEntry } from "@/hooks/use-entries";
import {
  PRIMARY_COLOR,
  SemanticColors,
  ViewerColors,
  Spacing,
} from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type MenuState = "closed" | "options" | "confirmDelete" | "edit";

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // TanStack Query hooks
  const { data: entry, isLoading, isError } = useEntry(id);
  const updateEntryMutation = useUpdateEntry();
  const deleteEntryMutation = useDeleteEntry();

  const [activeIndex, setActiveIndex] = useState(0);
  const [menuState, setMenuState] = useState<MenuState>("closed");
  const [editCaption, setEditCaption] = useState("");

  // Sync editCaption with entry when entry loads or changes
  useEffect(() => {
    if (entry?.caption) {
      setEditCaption(entry.caption);
    }
  }, [entry?.caption]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(contentOffsetX / SCREEN_WIDTH);
      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
      }
    },
    [activeIndex],
  );

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleOpenOptions = useCallback(() => {
    setMenuState("options");
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuState("closed");
  }, []);

  const handleDeletePrompt = useCallback(() => {
    setMenuState("confirmDelete");
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (entry) {
      deleteEntryMutation.mutate(entry.id, {
        onSuccess: () => {
          router.back();
        },
      });
    }
  }, [entry, deleteEntryMutation]);

  const handleEdit = useCallback(() => {
    setEditCaption(entry?.caption ?? "");
    setMenuState("edit");
  }, [entry?.caption]);

  const handleSaveEdit = useCallback(() => {
    if (entry) {
      updateEntryMutation.mutate(
        { id: entry.id, updates: { caption: editCaption } },
        {
          onSuccess: () => {
            setMenuState("closed");
          },
        },
      );
    }
  }, [entry, editCaption, updateEntryMutation]);

  const handleCancelEdit = useCallback(() => {
    setMenuState("closed");
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.notFoundContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  // Not found state (error or missing entry)
  if (isError || !entry) {
    return (
      <View style={styles.notFoundContainer}>
        <ThemedText style={styles.notFoundText}>Entry not found</ThemedText>
        <Pressable
          testID="back-button"
          onPress={handleBack}
          style={styles.notFoundBackButton}
        >
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </Pressable>
      </View>
    );
  }

  const hasMedia = entry.mediaUris && entry.mediaUris.length > 0;
  const isVideo = entry.type === "video";
  const isMultiPhoto = hasMedia && !isVideo && entry.mediaUris!.length > 1;

  const formattedDate = new Date(entry.date).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header with back button and options */}
      <View style={styles.header}>
        <Pressable
          testID="back-button"
          onPress={handleBack}
          style={styles.backButton}
        >
          <ThemedText style={styles.backButtonIcon}>←</ThemedText>
        </Pressable>
        <View style={styles.headerRight}>
          {isMultiPhoto && (
            <View testID="image-counter" style={styles.imageCounter}>
              <ThemedText style={styles.imageCounterText}>
                {activeIndex + 1}/{entry.mediaUris!.length}
              </ThemedText>
            </View>
          )}
          <Pressable
            testID="options-button"
            onPress={handleOpenOptions}
            style={styles.optionsButton}
          >
            <ThemedText style={styles.optionsButtonIcon}>⋮</ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Full-screen video player */}
      {hasMedia && isVideo && (
        <View style={styles.videoContainer}>
          <VideoPlayer
            uri={entry.mediaUris![0]}
            aspectRatio={(SCREEN_HEIGHT * 0.7) / SCREEN_WIDTH}
            showControls={true}
          />
        </View>
      )}

      {/* Full-screen image carousel */}
      {hasMedia && !isVideo && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.imageScrollView}
          contentContainerStyle={styles.imageScrollContent}
        >
          {entry.mediaUris!.map((uri, index) => (
            <Image
              key={`${uri}-${index}`}
              source={{ uri }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          ))}
        </ScrollView>
      )}

      {/* Caption and details overlay */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailsContent}>
          {entry.caption && (
            <ThemedText style={styles.caption}>{entry.caption}</ThemedText>
          )}
          <ThemedText style={styles.date}>{formattedDate}</ThemedText>
        </View>
      </View>

      {/* Options/Delete Modal */}
      <Modal
        visible={menuState === "options" || menuState === "confirmDelete"}
        transparent
        animationType="fade"
        onRequestClose={handleCloseMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseMenu}>
          <View style={styles.menuContainer}>
            {menuState === "options" && (
              <>
                <Pressable style={styles.menuItem} onPress={handleEdit}>
                  <ThemedText style={styles.menuItemText}>Edit</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.menuItem, styles.menuItemDanger]}
                  onPress={handleDeletePrompt}
                >
                  <ThemedText style={styles.menuItemTextDanger}>
                    Delete
                  </ThemedText>
                </Pressable>
              </>
            )}
            {menuState === "confirmDelete" && (
              <>
                <ThemedText style={styles.confirmTitle}>
                  Delete this entry?
                </ThemedText>
                <ThemedText style={styles.confirmMessage}>
                  This action cannot be undone.
                </ThemedText>
                <Pressable
                  style={[styles.menuItem, styles.menuItemDanger]}
                  onPress={handleConfirmDelete}
                >
                  <ThemedText style={styles.menuItemTextDanger}>
                    Delete Entry
                  </ThemedText>
                </Pressable>
                <Pressable style={styles.menuItem} onPress={handleCloseMenu}>
                  <ThemedText style={styles.menuItemText}>Cancel</ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Edit Modal */}
      <Modal
        testID="edit-modal"
        visible={menuState === "edit"}
        transparent
        animationType="slide"
        onRequestClose={handleCancelEdit}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.editModalContainer}
        >
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Pressable
                testID="edit-cancel-button"
                onPress={handleCancelEdit}
                style={styles.editHeaderButton}
              >
                <ThemedText style={styles.editCancelText}>Cancel</ThemedText>
              </Pressable>
              <ThemedText style={styles.editModalTitle}>Edit Entry</ThemedText>
              <Pressable
                onPress={handleSaveEdit}
                style={styles.editHeaderButton}
              >
                <ThemedText style={styles.editSaveText}>Save</ThemedText>
              </Pressable>
            </View>

            <View style={styles.editFormContainer}>
              <ThemedText style={styles.editLabel}>Caption</ThemedText>
              <TextInput
                testID="caption-input"
                value={editCaption}
                onChangeText={setEditCaption}
                style={styles.editInput}
                placeholder="Add a caption..."
                placeholderTextColor={ViewerColors.textPlaceholder}
                multiline
                maxLength={500}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ViewerColors.background,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: ViewerColors.background,
  },
  notFoundText: {
    color: ViewerColors.text,
    fontSize: 18,
    marginBottom: Spacing.lg,
  },
  notFoundBackButton: {
    padding: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: ViewerColors.buttonBackground,
    borderRadius: Spacing.sm,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ViewerColors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonIcon: {
    color: ViewerColors.text,
    fontSize: 24,
  },
  backButtonText: {
    color: ViewerColors.text,
    fontSize: 16,
  },
  imageCounter: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    backgroundColor: ViewerColors.overlay,
    borderRadius: Spacing.lg,
  },
  imageCounterText: {
    color: ViewerColors.text,
    fontSize: 14,
  },
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageScrollView: {
    flex: 1,
  },
  imageScrollContent: {
    alignItems: "center",
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  detailsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
  },
  detailsContent: {
    padding: Spacing.lg,
    backgroundColor: ViewerColors.overlayStrong,
  },
  caption: {
    color: ViewerColors.text,
    fontSize: 16,
    marginBottom: Spacing.sm,
  },
  date: {
    color: ViewerColors.textMuted,
    fontSize: 14,
  },
  optionsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ViewerColors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  optionsButtonIcon: {
    color: ViewerColors.text,
    fontSize: 24,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: ViewerColors.overlayStrong,
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    backgroundColor: ViewerColors.modalBackground,
    borderRadius: 14,
    width: 280,
    overflow: "hidden",
  },
  menuItem: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ViewerColors.modalBorder,
  },
  menuItemDanger: {
    // No additional styling, just marker for semantic meaning
  },
  menuItemText: {
    color: ViewerColors.text,
    fontSize: 17,
    textAlign: "center",
  },
  menuItemTextDanger: {
    color: SemanticColors.error,
    fontSize: 17,
    textAlign: "center",
  },
  confirmTitle: {
    color: ViewerColors.text,
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    paddingTop: Spacing.lg + 4,
    paddingHorizontal: Spacing.lg + 4,
  },
  confirmMessage: {
    color: ViewerColors.textSubtle,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: Spacing.lg + 4,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  editModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: ViewerColors.overlay,
  },
  editModalContent: {
    backgroundColor: ViewerColors.modalBackground,
    borderTopLeftRadius: Spacing.lg,
    borderTopRightRadius: Spacing.lg,
    paddingBottom: 40,
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ViewerColors.modalBorder,
  },
  editHeaderButton: {
    minWidth: 60,
  },
  editModalTitle: {
    color: ViewerColors.text,
    fontSize: 17,
    fontWeight: "600",
  },
  editCancelText: {
    color: PRIMARY_COLOR,
    fontSize: 17,
  },
  editSaveText: {
    color: PRIMARY_COLOR,
    fontSize: 17,
    fontWeight: "600",
    textAlign: "right",
  },
  editFormContainer: {
    padding: Spacing.lg,
  },
  editLabel: {
    color: ViewerColors.textSubtle,
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  editInput: {
    backgroundColor: ViewerColors.inputBackground,
    borderRadius: 10,
    padding: Spacing.md,
    color: ViewerColors.text,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
});
