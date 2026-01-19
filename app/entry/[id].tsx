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
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { VideoPlayer } from "@/components/video-player";
import { useEntry, useUpdateEntry, useDeleteEntry } from "@/hooks/use-entries";
import { useMilestoneSuggestions } from "@/hooks/use-milestone-suggestions";
import {
  useComments,
  useReactions,
  useDeleteComment,
} from "@/hooks/use-comments";
import { useAuth } from "@/contexts/auth-context";
import { useViewer } from "@/contexts/viewer-context";
import {
  PRIMARY_COLOR,
  SemanticColors,
  ViewerColors,
  Spacing,
} from "@/constants/theme";
import type { Comment } from "@/services/api-client";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type MenuState =
  | "closed"
  | "options"
  | "confirmDelete"
  | "edit"
  | "comments"
  | "confirmDeleteComment";

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const {
    canEdit,
    canDelete,
    canComment,
    canReact,
    isParent,
    permissionLevel,
  } = useViewer();

  // TanStack Query hooks
  const { data: entry, isLoading, isError } = useEntry(id);
  const updateEntryMutation = useUpdateEntry();
  const deleteEntryMutation = useDeleteEntry();

  // Comments and reactions hooks (PRD SHARE-006, SHARE-010)
  const { data: comments = [] } = useComments(id ?? "");
  const { data: reactions = [] } = useReactions(id ?? "");
  const deleteCommentMutation = useDeleteComment();

  // AI Milestone Suggestions (AIDETECT-003, AIDETECT-004)
  const { acceptSuggestion, dismissSuggestion, getPendingSuggestions } =
    useMilestoneSuggestions();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAcceptingSuggestion, setIsAcceptingSuggestion] = useState(false);
  const [menuState, setMenuState] = useState<MenuState>("closed");
  const [editCaption, setEditCaption] = useState("");
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);

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
      // Get user display name: nickname or email prefix as fallback
      const userName =
        user?.name ?? user?.email?.split("@")[0] ?? "Unknown User";

      updateEntryMutation.mutate(
        {
          id: entry.id,
          updates: {
            caption: editCaption,
            updatedBy: user?.id,
            updatedByName: userName,
          },
        },
        {
          onSuccess: () => {
            setMenuState("closed");
          },
        },
      );
    }
  }, [entry, editCaption, updateEntryMutation, user]);

  const handleCancelEdit = useCallback(() => {
    setMenuState("closed");
  }, []);

  // Comments modal handlers (PRD SHARE-006, SHARE-010)
  const handleOpenComments = useCallback(() => {
    setMenuState("comments");
  }, []);

  const handleDeleteCommentPrompt = useCallback((comment: Comment) => {
    setSelectedComment(comment);
    setMenuState("confirmDeleteComment");
  }, []);

  const handleConfirmDeleteComment = useCallback(() => {
    if (selectedComment && id) {
      deleteCommentMutation.mutate(
        { commentId: selectedComment.id, entryId: id },
        {
          onSuccess: () => {
            setSelectedComment(null);
            setMenuState("comments");
          },
        },
      );
    }
  }, [selectedComment, id, deleteCommentMutation]);

  const handleCancelDeleteComment = useCallback(() => {
    setSelectedComment(null);
    setMenuState("comments");
  }, []);

  // AI Milestone Suggestion handlers (AIDETECT-003, AIDETECT-004)
  const handleAcceptSuggestion = useCallback(
    async (templateId: string) => {
      if (!entry) return;
      setIsAcceptingSuggestion(true);
      try {
        const result = await acceptSuggestion(entry, templateId);
        if (result.success) {
          Alert.alert(
            "Milestone Created!",
            "This entry has been linked to the milestone. View it in the Milestones tab.",
            [{ text: "OK" }],
          );
        }
      } finally {
        setIsAcceptingSuggestion(false);
      }
    },
    [entry, acceptSuggestion],
  );

  const handleDismissSuggestion = useCallback(
    async (templateId: string) => {
      if (!entry) return;
      await dismissSuggestion(entry, templateId);
    },
    [entry, dismissSuggestion],
  );

  // Get pending suggestions for current entry
  const pendingSuggestions = entry ? getPendingSuggestions(entry) : [];

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
          {/* View-only badge for family members with view_only permission (PRD SHARE-005) */}
          {!isParent && permissionLevel === "view_only" && (
            <View testID="view-only-badge" style={styles.viewOnlyBadge}>
              <ThemedText style={styles.viewOnlyBadgeText}>
                View Only
              </ThemedText>
            </View>
          )}
          {isMultiPhoto && (
            <View testID="image-counter" style={styles.imageCounter}>
              <ThemedText style={styles.imageCounterText}>
                {activeIndex + 1}/{entry.mediaUris!.length}
              </ThemedText>
            </View>
          )}
          {/* Only show options button for parents who can edit/delete */}
          {isParent && (canEdit || canDelete) && (
            <Pressable
              testID="options-button"
              onPress={handleOpenOptions}
              style={styles.optionsButton}
            >
              <ThemedText style={styles.optionsButtonIcon}>⋮</ThemedText>
            </Pressable>
          )}
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
          <View style={styles.metaRow}>
            <ThemedText style={styles.date}>{formattedDate}</ThemedText>
            {/* Show "Edited by" when entry was edited by different user (PRD ENTRY-013) */}
            {entry.updatedBy &&
              entry.updatedByName &&
              entry.updatedBy !== entry.createdBy && (
                <ThemedText style={styles.editedBy}>
                  · Edited by {entry.updatedByName}
                </ThemedText>
              )}
          </View>
          {/* Reactions and comments row (PRD SHARE-006, SHARE-005) */}
          <Pressable
            testID="comments-button"
            style={[
              styles.engagementRow,
              !canComment && !canReact && styles.engagementRowDisabled,
            ]}
            onPress={canComment || canReact ? handleOpenComments : undefined}
            disabled={!canComment && !canReact}
            accessibilityState={{ disabled: !canComment && !canReact }}
          >
            {reactions.length > 0 && (
              <View style={styles.engagementItem}>
                <ThemedText style={styles.engagementEmoji}>❤️</ThemedText>
                <ThemedText style={styles.engagementCount}>
                  {reactions.length}
                </ThemedText>
              </View>
            )}
            <View style={styles.engagementItem}>
              <ThemedText style={styles.engagementEmoji}>💬</ThemedText>
              <ThemedText style={styles.engagementCount}>
                {comments.length}
              </ThemedText>
            </View>
          </Pressable>

          {/* AI-Generated Tags (AIDETECT-005) */}
          {entry.aiLabels && entry.aiLabels.length > 0 && (
            <View style={styles.aiTagsContainer} testID="ai-tags-section">
              <ThemedText style={styles.aiTagsLabel}>🏷️ AI Tags</ThemedText>
              <View style={styles.aiTagsRow}>
                {entry.aiLabels.map((label, index) => (
                  <View key={`${label}-${index}`} style={styles.aiTag}>
                    <ThemedText style={styles.aiTagText}>{label}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* AI Milestone Suggestions (AIDETECT-003, AIDETECT-004) */}
          {pendingSuggestions.length > 0 && isParent && (
            <View
              style={styles.milestoneSuggestionsContainer}
              testID="milestone-suggestions"
            >
              <View style={styles.milestoneSuggestionsHeader}>
                <ThemedText style={styles.milestoneSuggestionsIcon}>
                  🎯
                </ThemedText>
                <ThemedText style={styles.milestoneSuggestionsTitle}>
                  Milestone Detected
                </ThemedText>
              </View>
              <ThemedText style={styles.milestoneSuggestionsHint}>
                Link this entry to a milestone?
              </ThemedText>
              {pendingSuggestions.map((suggestion) => (
                <View
                  key={suggestion.templateId}
                  style={styles.suggestionCard}
                  testID={`suggestion-${suggestion.templateId}`}
                >
                  <View style={styles.suggestionInfo}>
                    <ThemedText style={styles.suggestionTitle}>
                      {suggestion.title}
                    </ThemedText>
                    <ThemedText style={styles.suggestionConfidence}>
                      {Math.round(suggestion.confidence * 100)}% match
                    </ThemedText>
                  </View>
                  <View style={styles.suggestionActions}>
                    <Pressable
                      style={styles.suggestionAcceptButton}
                      onPress={() =>
                        handleAcceptSuggestion(suggestion.templateId)
                      }
                      disabled={isAcceptingSuggestion}
                      testID={`accept-suggestion-${suggestion.templateId}`}
                    >
                      {isAcceptingSuggestion ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <ThemedText style={styles.suggestionAcceptText}>
                          Accept
                        </ThemedText>
                      )}
                    </Pressable>
                    <Pressable
                      style={styles.suggestionDismissButton}
                      onPress={() =>
                        handleDismissSuggestion(suggestion.templateId)
                      }
                      disabled={isAcceptingSuggestion}
                      testID={`dismiss-suggestion-${suggestion.templateId}`}
                    >
                      <ThemedText style={styles.suggestionDismissText}>
                        ✕
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
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

      {/* Comments Modal (PRD SHARE-006, SHARE-010) */}
      <Modal
        testID="comments-modal"
        visible={
          menuState === "comments" || menuState === "confirmDeleteComment"
        }
        transparent
        animationType="slide"
        onRequestClose={handleCloseMenu}
      >
        <View style={styles.commentsModalContainer}>
          <View style={styles.commentsModalContent}>
            <View style={styles.commentsModalHeader}>
              <ThemedText style={styles.commentsModalTitle}>
                Comments & Reactions
              </ThemedText>
              <Pressable
                testID="close-comments-button"
                onPress={handleCloseMenu}
                style={styles.closeCommentsButton}
              >
                <ThemedText style={styles.closeCommentsText}>✕</ThemedText>
              </Pressable>
            </View>

            {/* Reactions summary */}
            {reactions.length > 0 && (
              <View style={styles.reactionsSection}>
                <ThemedText style={styles.sectionTitle}>Reactions</ThemedText>
                <View style={styles.reactionsList}>
                  {reactions.map((reaction) => (
                    <View key={reaction.id} style={styles.reactionItem}>
                      <ThemedText style={styles.reactionEmoji}>
                        {reaction.emoji}
                      </ThemedText>
                      <ThemedText style={styles.reactionAuthor}>
                        {reaction.userName}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Comments list */}
            <View style={styles.commentsSection}>
              <ThemedText style={styles.sectionTitle}>
                Comments ({comments.length})
              </ThemedText>
              {comments.length === 0 ? (
                <ThemedText style={styles.noCommentsText}>
                  No comments yet
                </ThemedText>
              ) : (
                <ScrollView style={styles.commentsList}>
                  {comments.map((comment) => (
                    <View key={comment.id} style={styles.commentItem}>
                      <View style={styles.commentHeader}>
                        <ThemedText style={styles.commentAuthor}>
                          {comment.authorName}
                        </ThemedText>
                        <ThemedText style={styles.commentDate}>
                          {new Date(comment.createdAt).toLocaleDateString(
                            "en-SG",
                            {
                              day: "numeric",
                              month: "short",
                            },
                          )}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.commentText}>
                        {comment.text}
                      </ThemedText>
                      {/* Delete button for parents (PRD SHARE-010) */}
                      <Pressable
                        testID={`delete-comment-${comment.id}`}
                        style={styles.deleteCommentButton}
                        onPress={() => handleDeleteCommentPrompt(comment)}
                      >
                        <ThemedText style={styles.deleteCommentText}>
                          Delete
                        </ThemedText>
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Delete comment confirmation */}
            {menuState === "confirmDeleteComment" && selectedComment && (
              <View style={styles.deleteConfirmOverlay}>
                <View style={styles.deleteConfirmBox}>
                  <ThemedText style={styles.confirmTitle}>
                    Delete this comment?
                  </ThemedText>
                  <ThemedText style={styles.confirmMessage}>
                    &ldquo;{selectedComment.text.substring(0, 50)}
                    {selectedComment.text.length > 50 ? "..." : ""}&rdquo;
                  </ThemedText>
                  <View style={styles.confirmButtons}>
                    <Pressable
                      testID="cancel-delete-comment"
                      style={styles.confirmButton}
                      onPress={handleCancelDeleteComment}
                    >
                      <ThemedText style={styles.menuItemText}>
                        Cancel
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      testID="confirm-delete-comment"
                      style={[styles.confirmButton, styles.confirmButtonDanger]}
                      onPress={handleConfirmDeleteComment}
                    >
                      <ThemedText style={styles.menuItemTextDanger}>
                        Delete
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
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
  viewOnlyBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    backgroundColor: ViewerColors.overlay,
    borderRadius: Spacing.lg,
  },
  viewOnlyBadgeText: {
    color: ViewerColors.textMuted,
    fontSize: 12,
    fontWeight: "500",
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  date: {
    color: ViewerColors.textMuted,
    fontSize: 14,
  },
  editedBy: {
    color: ViewerColors.textMuted,
    fontSize: 14,
    fontStyle: "italic",
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
  // Engagement row (reactions & comments counts)
  engagementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  engagementRowDisabled: {
    opacity: 0.5,
  },
  engagementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  engagementEmoji: {
    fontSize: 16,
  },
  engagementCount: {
    color: ViewerColors.textMuted,
    fontSize: 14,
  },
  // Comments modal
  commentsModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: ViewerColors.overlay,
  },
  commentsModalContent: {
    backgroundColor: ViewerColors.modalBackground,
    borderTopLeftRadius: Spacing.lg,
    borderTopRightRadius: Spacing.lg,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  commentsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ViewerColors.modalBorder,
  },
  commentsModalTitle: {
    color: ViewerColors.text,
    fontSize: 17,
    fontWeight: "600",
  },
  closeCommentsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ViewerColors.buttonBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  closeCommentsText: {
    color: ViewerColors.text,
    fontSize: 16,
  },
  reactionsSection: {
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ViewerColors.modalBorder,
  },
  sectionTitle: {
    color: ViewerColors.textSubtle,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: Spacing.md,
  },
  reactionsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  reactionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: ViewerColors.buttonBackground,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.lg,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionAuthor: {
    color: ViewerColors.text,
    fontSize: 14,
  },
  commentsSection: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  commentsList: {
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  noCommentsText: {
    color: ViewerColors.textMuted,
    fontSize: 14,
    fontStyle: "italic",
  },
  commentItem: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ViewerColors.modalBorder,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  commentAuthor: {
    color: ViewerColors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  commentDate: {
    color: ViewerColors.textMuted,
    fontSize: 12,
  },
  commentText: {
    color: ViewerColors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  deleteCommentButton: {
    alignSelf: "flex-start",
    marginTop: Spacing.sm,
  },
  deleteCommentText: {
    color: SemanticColors.error,
    fontSize: 13,
  },
  deleteConfirmOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: ViewerColors.overlayStrong,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteConfirmBox: {
    backgroundColor: ViewerColors.modalBackground,
    borderRadius: 14,
    padding: Spacing.lg,
    width: 280,
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    backgroundColor: ViewerColors.buttonBackground,
    alignItems: "center",
  },
  confirmButtonDanger: {
    backgroundColor: SemanticColors.errorLight,
  },
  // AI Milestone Suggestion styles (AIDETECT-003, AIDETECT-004)
  milestoneSuggestionsContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  milestoneSuggestionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  milestoneSuggestionsIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  milestoneSuggestionsTitle: {
    color: ViewerColors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  milestoneSuggestionsHint: {
    color: ViewerColors.textMuted,
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ViewerColors.buttonBackground,
    borderRadius: 8,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionTitle: {
    color: ViewerColors.text,
    fontSize: 14,
    fontWeight: "500",
  },
  suggestionConfidence: {
    color: ViewerColors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  suggestionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  suggestionAcceptButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 6,
    minWidth: 60,
    alignItems: "center",
  },
  suggestionAcceptText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  suggestionDismissButton: {
    padding: Spacing.sm,
  },
  suggestionDismissText: {
    color: ViewerColors.textMuted,
    fontSize: 16,
  },
  // AI Tags styles (AIDETECT-005)
  aiTagsContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ViewerColors.modalBorder,
  },
  aiTagsLabel: {
    color: ViewerColors.textMuted,
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  aiTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  aiTag: {
    backgroundColor: ViewerColors.buttonBackground,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiTagText: {
    color: ViewerColors.text,
    fontSize: 12,
  },
});
