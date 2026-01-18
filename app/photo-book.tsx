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
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  usePhotoBook,
  type PhotoBookPage,
  BOOK_LAYOUTS,
  COVER_COLOR_THEMES,
  type CoverColorTheme,
} from "@/contexts/photo-book-context";
import {
  Colors,
  PRIMARY_COLOR,
  SemanticColors,
  Shadows,
  Spacing,
} from "@/constants/theme";

type ModalState = "closed" | "editCaption" | "editCover";

type ColorScheme = (typeof Colors)["light"];

function PageCard({
  page,
  index,
  totalPages,
  onEditCaption,
  onRemove,
  onMoveUp,
  onMoveDown,
  colors,
}: {
  page: PhotoBookPage;
  index: number;
  totalPages: number;
  onEditCaption: (page: PhotoBookPage) => void;
  onRemove: (pageId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  colors: ColorScheme;
}) {
  const isTitle = page.type === "title";
  const isMilestone = page.type === "milestone";
  const canMoveUp = !isTitle && index > 1; // Can't move to position 0 (title)
  const canMoveDown = !isTitle && index < totalPages - 1;

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

      {/* Move buttons for reordering */}
      {!isTitle && (
        <View style={styles.moveButtons}>
          <Pressable
            testID={`move-up-${page.id}`}
            style={[styles.moveButton, !canMoveUp && styles.moveButtonDisabled]}
            onPress={() => canMoveUp && onMoveUp(index)}
            disabled={!canMoveUp}
          >
            <Text style={styles.moveButtonText}>↑</Text>
          </Pressable>
          <Pressable
            testID={`move-down-${page.id}`}
            style={[
              styles.moveButton,
              !canMoveDown && styles.moveButtonDisabled,
            ]}
            onPress={() => canMoveDown && onMoveDown(index)}
            disabled={!canMoveDown}
          >
            <Text style={styles.moveButtonText}>↓</Text>
          </Pressable>
        </View>
      )}

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
    selectedLayout,
    cover,
    isGenerating,
    isExporting,
    canExportPdf,
    generatePhotoBook,
    reorderPage,
    removePage,
    addPage,
    updatePageCaption,
    setSelectedLayout,
    updateCover,
    clearPhotoBook,
    exportPdf,
  } = usePhotoBook();

  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [modalState, setModalState] = useState<ModalState>("closed");
  const [editingPage, setEditingPage] = useState<PhotoBookPage | null>(null);
  const [editCaption, setEditCaption] = useState("");

  // Cover editor state
  const [editCoverTitle, setEditCoverTitle] = useState(cover.title);
  const [editChildName, setEditChildName] = useState(cover.childName || "");
  const [editDateRange, setEditDateRange] = useState(cover.dateRange || "");

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
    exportPdf();
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

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      addPage({
        type: "photo",
        imageUri: result.assets[0].uri,
        date: new Date().toISOString(),
      });
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 1) {
      // Can't move to position 0 (title)
      reorderPage(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < pages.length - 1) {
      reorderPage(index, index + 1);
    }
  };

  const handleOpenCoverEditor = () => {
    setEditCoverTitle(cover.title);
    setEditChildName(cover.childName || "");
    setEditDateRange(cover.dateRange || "");
    setModalState("editCover");
  };

  const handleSaveCover = () => {
    updateCover({
      title: editCoverTitle,
      childName: editChildName || undefined,
      dateRange: editDateRange || undefined,
    });
    setModalState("closed");
  };

  const handleSelectCoverPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      updateCover({ photoUri: result.assets[0].uri });
    }
  };

  const handleSelectColorTheme = (theme: CoverColorTheme) => {
    updateCover({ colorTheme: theme });
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
      totalPages={pages.length}
      onEditCaption={handleEditCaption}
      onRemove={handleRemovePage}
      onMoveUp={handleMoveUp}
      onMoveDown={handleMoveDown}
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
        <View style={styles.headerActions}>
          <Pressable
            testID="cover-editor-button"
            style={styles.headerActionButton}
            onPress={handleOpenCoverEditor}
          >
            <Text style={styles.headerActionText}>Cover</Text>
          </Pressable>
          <Pressable
            testID="add-photo-button"
            style={styles.addPhotoButton}
            onPress={handleAddPhoto}
          >
            <Text style={styles.addPhotoButtonText}>+ Add</Text>
          </Pressable>
        </View>
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

      {/* Layout Template Selector */}
      <View
        style={[styles.layoutSection, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>
          Layout Template
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.layoutScrollContent}
        >
          {BOOK_LAYOUTS.map((layout) => (
            <Pressable
              key={layout.id}
              testID={`layout-${layout.id}`}
              style={[
                styles.layoutCard,
                {
                  backgroundColor: colors.card,
                  borderColor:
                    selectedLayout === layout.id
                      ? PRIMARY_COLOR
                      : colors.cardBorder,
                  borderWidth: selectedLayout === layout.id ? 2 : 1,
                },
              ]}
              onPress={() => setSelectedLayout(layout.id)}
            >
              <Text style={styles.layoutIcon}>{layout.icon}</Text>
              <Text
                style={[
                  styles.layoutName,
                  {
                    color:
                      selectedLayout === layout.id
                        ? PRIMARY_COLOR
                        : colors.text,
                    fontWeight: selectedLayout === layout.id ? "600" : "400",
                  },
                ]}
              >
                {layout.name}
              </Text>
              <Text
                style={[styles.layoutDescription, { color: colors.textMuted }]}
                numberOfLines={2}
              >
                {layout.description}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
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

      {/* Cover Editor Modal */}
      <Modal
        visible={modalState === "editCover"}
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
              Cover Editor
            </Text>
            <Pressable onPress={handleSaveCover}>
              <Text style={styles.modalSave}>Done</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.coverEditorContent}>
            {/* Cover Photo */}
            <View style={styles.coverSection}>
              <Text style={[styles.coverSectionTitle, { color: colors.text }]}>
                Cover Photo
              </Text>
              <Pressable
                testID="select-cover-photo"
                style={[
                  styles.coverPhotoSelector,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
                onPress={handleSelectCoverPhoto}
              >
                {cover.photoUri ? (
                  <Image
                    source={{ uri: cover.photoUri }}
                    style={styles.coverPhotoPreview}
                  />
                ) : (
                  <View style={styles.coverPhotoPlaceholder}>
                    <Text style={styles.coverPhotoPlaceholderIcon}>📷</Text>
                    <Text
                      style={[
                        styles.coverPhotoPlaceholderText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Tap to select photo
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Cover Title */}
            <View style={styles.coverSection}>
              <Text style={[styles.coverSectionTitle, { color: colors.text }]}>
                Title
              </Text>
              <TextInput
                style={[
                  styles.coverInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                value={editCoverTitle}
                onChangeText={setEditCoverTitle}
                placeholder="Enter title..."
                placeholderTextColor={colors.placeholder}
              />
            </View>

            {/* Child's Name */}
            <View style={styles.coverSection}>
              <Text style={[styles.coverSectionTitle, { color: colors.text }]}>
                Child&apos;s Name
              </Text>
              <TextInput
                style={[
                  styles.coverInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                value={editChildName}
                onChangeText={setEditChildName}
                placeholder="Enter child's name..."
                placeholderTextColor={colors.placeholder}
              />
            </View>

            {/* Date Range */}
            <View style={styles.coverSection}>
              <Text style={[styles.coverSectionTitle, { color: colors.text }]}>
                Date Range
              </Text>
              <TextInput
                style={[
                  styles.coverInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                value={editDateRange}
                onChangeText={setEditDateRange}
                placeholder="e.g., January 2024 - December 2024"
                placeholderTextColor={colors.placeholder}
              />
            </View>

            {/* Cover Color Theme */}
            <View style={styles.coverSection}>
              <Text style={[styles.coverSectionTitle, { color: colors.text }]}>
                Cover Color
              </Text>
              <View style={styles.colorThemeGrid}>
                {COVER_COLOR_THEMES.map((theme) => (
                  <Pressable
                    key={theme.id}
                    testID={`color-theme-${theme.id}`}
                    style={[
                      styles.colorThemeItem,
                      {
                        backgroundColor: theme.background,
                        borderColor:
                          cover.colorTheme === theme.id
                            ? colors.text
                            : theme.background,
                        borderWidth: cover.colorTheme === theme.id ? 3 : 1,
                      },
                    ]}
                    onPress={() => handleSelectColorTheme(theme.id)}
                  >
                    {cover.colorTheme === theme.id && (
                      <Text
                        style={[styles.colorThemeCheck, { color: theme.text }]}
                      >
                        ✓
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
              <View style={styles.colorThemeLabels}>
                {COVER_COLOR_THEMES.map((theme) => (
                  <Text
                    key={theme.id}
                    style={[
                      styles.colorThemeLabel,
                      { color: colors.textMuted },
                    ]}
                  >
                    {theme.name}
                  </Text>
                ))}
              </View>
            </View>

            {/* Cover Preview */}
            <View style={styles.coverSection}>
              <Text style={[styles.coverSectionTitle, { color: colors.text }]}>
                Preview
              </Text>
              <View
                style={[
                  styles.coverPreview,
                  {
                    backgroundColor:
                      COVER_COLOR_THEMES.find((t) => t.id === cover.colorTheme)
                        ?.background || "#FF6B6B",
                  },
                ]}
              >
                {cover.photoUri && (
                  <Image
                    source={{ uri: cover.photoUri }}
                    style={styles.coverPreviewPhoto}
                  />
                )}
                <Text
                  style={[
                    styles.coverPreviewTitle,
                    {
                      color:
                        COVER_COLOR_THEMES.find(
                          (t) => t.id === cover.colorTheme,
                        )?.text || "#FFFFFF",
                    },
                  ]}
                >
                  {editCoverTitle || "My Photo Book"}
                </Text>
                {editChildName ? (
                  <Text
                    style={[
                      styles.coverPreviewChildName,
                      {
                        color:
                          COVER_COLOR_THEMES.find(
                            (t) => t.id === cover.colorTheme,
                          )?.text || "#FFFFFF",
                      },
                    ]}
                  >
                    {editChildName}
                  </Text>
                ) : null}
                {editDateRange ? (
                  <Text
                    style={[
                      styles.coverPreviewDateRange,
                      {
                        color:
                          COVER_COLOR_THEMES.find(
                            (t) => t.id === cover.colorTheme,
                          )?.text || "#FFFFFF",
                      },
                    ]}
                  >
                    {editDateRange}
                  </Text>
                ) : null}
              </View>
            </View>
          </ScrollView>
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
  addPhotoButton: {
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.lg,
  },
  addPhotoButtonText: {
    fontSize: 16,
    color: PRIMARY_COLOR,
    fontWeight: "500",
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
  layoutSection: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  layoutSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  layoutScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  layoutCard: {
    width: 130,
    padding: Spacing.md,
    borderRadius: Spacing.md,
    alignItems: "center",
  },
  layoutIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  layoutName: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  layoutDescription: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 14,
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
  moveButtons: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: "row",
    gap: Spacing.xs,
    zIndex: 1,
  },
  moveButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  moveButtonDisabled: {
    opacity: 0.3,
  },
  moveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
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
  // Header actions
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  headerActionButton: {
    paddingVertical: Spacing.sm,
  },
  headerActionText: {
    fontSize: 16,
    color: PRIMARY_COLOR,
    fontWeight: "500",
  },
  // Cover editor styles
  coverEditorContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  coverSection: {
    marginBottom: Spacing.xl,
  },
  coverSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  coverPhotoSelector: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  coverPhotoPreview: {
    width: "100%",
    height: "100%",
  },
  coverPhotoPlaceholder: {
    alignItems: "center",
  },
  coverPhotoPlaceholderIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  coverPhotoPlaceholderText: {
    fontSize: 12,
    textAlign: "center",
  },
  coverInput: {
    borderRadius: Spacing.sm,
    padding: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  colorThemeGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  colorThemeItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  colorThemeCheck: {
    fontSize: 18,
    fontWeight: "700",
  },
  colorThemeLabels: {
    flexDirection: "row",
    marginTop: Spacing.xs,
    gap: Spacing.md,
  },
  colorThemeLabel: {
    fontSize: 10,
    width: 44,
    textAlign: "center",
  },
  coverPreview: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: Spacing.md,
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  coverPreviewPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.md,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
  },
  coverPreviewTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  coverPreviewChildName: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.9,
  },
  coverPreviewDateRange: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.8,
    marginTop: Spacing.xs,
  },
});
