import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  useColorScheme,
} from "react-native";
import { router } from "expo-router";
import {
  usePhotoBook,
  type PhotoBookPage,
} from "@/contexts/photo-book-context";
import {
  Colors,
  PRIMARY_COLOR,
  SemanticColors,
  Shadows,
  Spacing,
} from "@/constants/theme";

type ModalState = "closed" | "editCaption";

type ColorScheme = (typeof Colors)["light"];

function PageCard({
  page,
  index,
  onEditCaption,
  onRemove,
  colors,
}: {
  page: PhotoBookPage;
  index: number;
  onEditCaption: (page: PhotoBookPage) => void;
  onRemove: (pageId: string) => void;
  colors: ColorScheme;
}) {
  const isTitle = page.type === "title";
  const isMilestone = page.type === "milestone";

  return (
    <View
      style={[
        styles.pageCard,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
        Shadows.medium,
      ]}
    >
      <View style={styles.pageNumber}>
        <Text style={styles.pageNumberText}>{index + 1}</Text>
      </View>

      {isTitle ? (
        <View
          style={[styles.titlePage, { backgroundColor: `${PRIMARY_COLOR}10` }]}
        >
          <Text style={styles.titlePageTitle}>{page.title}</Text>
          {page.caption && (
            <Text
              style={[styles.titlePageCaption, { color: colors.textSecondary }]}
            >
              {page.caption}
            </Text>
          )}
        </View>
      ) : (
        <>
          {page.imageUri && (
            <Image
              source={{ uri: page.imageUri }}
              style={[
                styles.pageImage,
                { backgroundColor: colors.backgroundTertiary },
              ]}
            />
          )}
          <View style={styles.pageContent}>
            {isMilestone && page.title && (
              <View
                style={[
                  styles.milestoneBadge,
                  { backgroundColor: SemanticColors.gold },
                ]}
              >
                <Text style={styles.milestoneBadgeText}>⭐ Milestone</Text>
              </View>
            )}
            {page.caption && (
              <Text
                style={[styles.pageCaption, { color: colors.text }]}
                numberOfLines={2}
              >
                {page.caption}
              </Text>
            )}
            {page.date && (
              <Text style={[styles.pageDate, { color: colors.textMuted }]}>
                {new Date(page.date).toLocaleDateString("en-SG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            )}
          </View>
        </>
      )}

      <View style={[styles.pageActions, { borderTopColor: colors.border }]}>
        {!isTitle && (
          <Pressable
            style={[
              styles.pageActionButton,
              { borderRightColor: colors.border },
            ]}
            onPress={() => onEditCaption(page)}
          >
            <Text style={styles.pageActionText}>Edit</Text>
          </Pressable>
        )}
        {!isTitle && (
          <Pressable
            style={[styles.pageActionButton, styles.pageRemoveButton]}
            onPress={() => onRemove(page.id)}
          >
            <Text
              style={[styles.pageRemoveText, { color: SemanticColors.error }]}
            >
              Remove
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function PhotoBookScreen() {
  const {
    pages,
    isGenerating,
    isExporting,
    canExportPdf,
    generatePhotoBook,
    removePage,
    updatePageCaption,
    clearPhotoBook,
  } = usePhotoBook();

  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [modalState, setModalState] = useState<ModalState>("closed");
  const [editingPage, setEditingPage] = useState<PhotoBookPage | null>(null);
  const [editCaption, setEditCaption] = useState("");

  useEffect(() => {
    // Auto-generate on first visit if no pages
    if (pages.length === 0 && !isGenerating) {
      generatePhotoBook();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditCaption = (page: PhotoBookPage) => {
    setEditingPage(page);
    setEditCaption(page.caption || "");
    setModalState("editCaption");
  };

  const handleSaveCaption = () => {
    if (editingPage) {
      updatePageCaption(editingPage.id, editCaption);
    }
    setModalState("closed");
    setEditingPage(null);
    setEditCaption("");
  };

  const handleRemovePage = (pageId: string) => {
    Alert.alert(
      "Remove Page",
      "Are you sure you want to remove this page from your photo book?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removePage(pageId),
        },
      ],
    );
  };

  const handleExport = () => {
    if (!canExportPdf) {
      Alert.alert(
        "Premium Feature",
        "PDF export is available for Standard and Premium subscribers.",
        [{ text: "OK" }],
      );
      return;
    }
    // TODO: Implement actual PDF export
    Alert.alert(
      "Coming Soon",
      "PDF export will be available in a future update.",
    );
  };

  const handleRegenerate = () => {
    Alert.alert(
      "Regenerate Photo Book",
      "This will reset your current customizations. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Regenerate",
          onPress: () => {
            clearPhotoBook();
            generatePhotoBook();
          },
        },
      ],
    );
  };

  const renderPage = ({
    item,
    index,
  }: {
    item: PhotoBookPage;
    index: number;
  }) => (
    <PageCard
      page={item}
      index={index}
      onEditCaption={handleEditCaption}
      onRemove={handleRemovePage}
      colors={colors}
    />
  );

  if (isGenerating) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Generating your photo book...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.backgroundSecondary },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Photo Book
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Stats Bar */}
      <View style={[styles.statsBar, { backgroundColor: colors.background }]}>
        <Text style={[styles.statsText, { color: colors.textSecondary }]}>
          {pages.length} page{pages.length !== 1 ? "s" : ""}
        </Text>
        <Pressable onPress={handleRegenerate}>
          <Text style={styles.regenerateText}>Regenerate</Text>
        </Pressable>
      </View>

      {/* Pages List */}
      {pages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Photos Yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Add some photo entries to create your photo book
          </Text>
        </View>
      ) : (
        <FlatList
          data={pages}
          renderItem={renderPage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Export Button */}
      {pages.length > 0 && (
        <View
          style={[
            styles.exportContainer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <Pressable
            style={[
              styles.exportButton,
              !canExportPdf && styles.exportButtonDisabled,
            ]}
            onPress={handleExport}
            disabled={isExporting}
          >
            <Text style={styles.exportButtonText}>
              {isExporting ? "Exporting..." : "Export as PDF"}
            </Text>
            {!canExportPdf && (
              <Text
                style={[styles.premiumBadge, { color: SemanticColors.gold }]}
              >
                Premium
              </Text>
            )}
          </Pressable>
        </View>
      )}

      {/* Edit Caption Modal */}
      <Modal
        visible={modalState === "editCaption"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalState("closed")}
      >
        <KeyboardAvoidingView
          style={[
            styles.modalContainer,
            { backgroundColor: colors.backgroundSecondary },
          ]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: colors.background,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Pressable onPress={() => setModalState("closed")}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Edit Caption
            </Text>
            <Pressable onPress={handleSaveCaption}>
              <Text style={styles.modalSave}>Save</Text>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={[
                styles.captionInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              value={editCaption}
              onChangeText={setEditCaption}
              placeholder="Add a caption..."
              placeholderTextColor={colors.placeholder}
              multiline
              maxLength={200}
              autoFocus
            />
            <Text style={[styles.charCount, { color: colors.textMuted }]}>
              {editCaption.length}/200
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  backButtonText: {
    fontSize: 16,
    color: PRIMARY_COLOR,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  statsText: {
    fontSize: 14,
  },
  regenerateText: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: Spacing.lg,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  pageCard: {
    borderRadius: Spacing.md,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  pageNumber: {
    position: "absolute",
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  pageNumberText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  titlePage: {
    padding: Spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  titlePageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: PRIMARY_COLOR,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  titlePageCaption: {
    fontSize: 16,
    textAlign: "center",
  },
  pageImage: {
    width: "100%",
    aspectRatio: 1,
  },
  pageContent: {
    padding: Spacing.md,
  },
  milestoneBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.xs,
    alignSelf: "flex-start",
    marginBottom: Spacing.sm,
  },
  milestoneBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
  },
  pageCaption: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  pageDate: {
    fontSize: 12,
  },
  pageActions: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pageActionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  pageActionText: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontWeight: "500",
  },
  pageRemoveButton: {
    borderRightWidth: 0,
  },
  pageRemoveText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  exportContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  exportButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: Spacing.lg,
    borderRadius: Spacing.md,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  premiumBadge: {
    marginLeft: Spacing.sm,
    fontSize: 12,
    fontWeight: "600",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalCancel: {
    fontSize: 16,
    color: PRIMARY_COLOR,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  modalSave: {
    fontSize: 16,
    fontWeight: "600",
    color: PRIMARY_COLOR,
  },
  modalContent: {
    padding: Spacing.lg,
  },
  captionInput: {
    borderRadius: Spacing.sm,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: Spacing.sm,
  },
});
