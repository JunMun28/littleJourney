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
} from "react-native";
import { router } from "expo-router";
import {
  usePhotoBook,
  type PhotoBookPage,
} from "@/contexts/photo-book-context";

const PRIMARY_COLOR = "#0a7ea4";

type ModalState = "closed" | "editCaption";

function PageCard({
  page,
  index,
  onEditCaption,
  onRemove,
}: {
  page: PhotoBookPage;
  index: number;
  onEditCaption: (page: PhotoBookPage) => void;
  onRemove: (pageId: string) => void;
}) {
  const isTitle = page.type === "title";
  const isMilestone = page.type === "milestone";

  return (
    <View style={styles.pageCard}>
      <View style={styles.pageNumber}>
        <Text style={styles.pageNumberText}>{index + 1}</Text>
      </View>

      {isTitle ? (
        <View style={styles.titlePage}>
          <Text style={styles.titlePageTitle}>{page.title}</Text>
          {page.caption && (
            <Text style={styles.titlePageCaption}>{page.caption}</Text>
          )}
        </View>
      ) : (
        <>
          {page.imageUri && (
            <Image source={{ uri: page.imageUri }} style={styles.pageImage} />
          )}
          <View style={styles.pageContent}>
            {isMilestone && page.title && (
              <View style={styles.milestoneBadge}>
                <Text style={styles.milestoneBadgeText}>⭐ Milestone</Text>
              </View>
            )}
            {page.caption && (
              <Text style={styles.pageCaption} numberOfLines={2}>
                {page.caption}
              </Text>
            )}
            {page.date && (
              <Text style={styles.pageDate}>
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

      <View style={styles.pageActions}>
        {!isTitle && (
          <Pressable
            style={styles.pageActionButton}
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
            <Text style={styles.pageRemoveText}>Remove</Text>
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
    />
  );

  if (isGenerating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Generating your photo book...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Photo Book</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
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
          <Text style={styles.emptyTitle}>No Photos Yet</Text>
          <Text style={styles.emptySubtitle}>
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
        <View style={styles.exportContainer}>
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
            {!canExportPdf && <Text style={styles.premiumBadge}>Premium</Text>}
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
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setModalState("closed")}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Edit Caption</Text>
            <Pressable onPress={handleSaveCaption}>
              <Text style={styles.modalSave}>Save</Text>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.captionInput}
              value={editCaption}
              onChangeText={setEditCaption}
              placeholder="Add a caption..."
              multiline
              maxLength={200}
              autoFocus
            />
            <Text style={styles.charCount}>{editCaption.length}/200</Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  statsText: {
    fontSize: 14,
    color: "#666",
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
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  pageCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pageNumber: {
    position: "absolute",
    top: 8,
    left: 8,
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
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
    backgroundColor: `${PRIMARY_COLOR}10`,
  },
  titlePageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: PRIMARY_COLOR,
    textAlign: "center",
    marginBottom: 8,
  },
  titlePageCaption: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  pageImage: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#e0e0e0",
  },
  pageContent: {
    padding: 12,
  },
  milestoneBadge: {
    backgroundColor: "#ffd700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  milestoneBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
  },
  pageCaption: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  pageDate: {
    fontSize: 12,
    color: "#999",
  },
  pageActions: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e0e0e0",
  },
  pageActionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#e0e0e0",
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
    color: "#ff3b30",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  exportContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e0e0e0",
  },
  exportButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  exportButtonDisabled: {
    backgroundColor: "#ccc",
  },
  exportButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  premiumBadge: {
    marginLeft: 8,
    fontSize: 12,
    color: "#ffd700",
    fontWeight: "600",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
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
    padding: 16,
  },
  captionInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 8,
  },
});
