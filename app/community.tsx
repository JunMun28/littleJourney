import { useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Alert,
} from "react-native";
import { Stack, router } from "expo-router";
import { useCommunity } from "@/contexts/community-context";
import { PRIMARY_COLOR, Colors } from "@/constants/theme";

export default function CommunityScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const {
    communityDataSharingEnabled,
    questions,
    submitQuestion,
    getQuestionsWithResponses,
  } = useCommunity();

  const [showAskModal, setShowAskModal] = useState(false);
  const [questionText, setQuestionText] = useState("");

  const questionsWithResponses = getQuestionsWithResponses();

  const handleSubmitQuestion = () => {
    if (!questionText.trim()) {
      Alert.alert(
        "Empty Question",
        "Please enter a question before submitting.",
      );
      return;
    }
    submitQuestion(questionText.trim());
    setQuestionText("");
    setShowAskModal(false);
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Require opt-in to use community features
  if (!communityDataSharingEnabled) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Community",
            headerBackTitle: "Back",
          }}
        />
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <View style={styles.disabledContainer}>
            <Text style={styles.disabledIcon}>🔒</Text>
            <Text style={[styles.disabledTitle, { color: colors.text }]}>
              Community Features Disabled
            </Text>
            <Text
              style={[
                styles.disabledDescription,
                { color: colors.textSecondary },
              ]}
            >
              Enable Community Data Sharing in Settings {">"} Data & Privacy to
              access community features.
            </Text>
            <Pressable
              style={styles.enableButton}
              onPress={() => router.back()}
              testID="go-to-settings-button"
            >
              <Text style={styles.enableButtonText}>Go to Settings</Text>
            </Pressable>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Community",
          headerBackTitle: "Back",
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.scrollView} testID="community-scroll">
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Ask the Community
            </Text>
            <Text
              style={[
                styles.headerDescription,
                { color: colors.textSecondary },
              ]}
            >
              Ask anonymous questions about milestones and get support from
              other parents.
            </Text>
          </View>

          {/* Ask Question Button */}
          <Pressable
            style={styles.askButton}
            onPress={() => setShowAskModal(true)}
            testID="ask-community-button"
          >
            <Text style={styles.askButtonText}>💬 Ask Community</Text>
          </Pressable>

          {/* Questions List */}
          <View style={styles.questionsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Your Questions ({questions.length})
            </Text>

            {questionsWithResponses.length === 0 ? (
              <View
                style={[styles.emptyState, { backgroundColor: colors.card }]}
              >
                <Text style={styles.emptyIcon}>❓</Text>
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  No questions yet. Tap &quot;Ask Community&quot; to get
                  started!
                </Text>
              </View>
            ) : (
              questionsWithResponses.map((q) => (
                <View
                  key={q.id}
                  style={[
                    styles.questionCard,
                    { backgroundColor: colors.card },
                  ]}
                  testID={`question-card-${q.id}`}
                >
                  <View style={styles.questionHeader}>
                    <Text
                      style={[
                        styles.anonymousBadge,
                        { color: colors.textMuted },
                      ]}
                    >
                      Anonymous
                    </Text>
                    <Text style={[styles.timeAgo, { color: colors.textMuted }]}>
                      {formatTimeAgo(q.submittedAt)}
                    </Text>
                  </View>
                  <Text style={[styles.questionText, { color: colors.text }]}>
                    {q.text}
                  </Text>

                  {/* Responses */}
                  <View style={styles.responsesSection}>
                    <Text
                      style={[
                        styles.responsesCount,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {q.responses.length} response
                      {q.responses.length !== 1 ? "s" : ""}
                    </Text>
                    {q.responses.map((r) => (
                      <View
                        key={r.id}
                        style={[
                          styles.responseCard,
                          { backgroundColor: colors.background },
                        ]}
                      >
                        <View style={styles.responseHeader}>
                          <Text
                            style={[
                              styles.anonymousBadge,
                              { color: colors.textMuted },
                            ]}
                          >
                            Anonymous Parent
                          </Text>
                          <Text
                            style={[
                              styles.timeAgo,
                              { color: colors.textMuted },
                            ]}
                          >
                            {formatTimeAgo(r.respondedAt)}
                          </Text>
                        </View>
                        <Text
                          style={[styles.responseText, { color: colors.text }]}
                        >
                          {r.text}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimerSection}>
            <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
              ⚠️ Responses are from other parents sharing their experiences.
              This is not medical advice. Consult your pediatrician for
              professional guidance.
            </Text>
          </View>
        </ScrollView>

        {/* Ask Question Modal */}
        <Modal
          visible={showAskModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAskModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <View
              style={[styles.modalContent, { backgroundColor: colors.card }]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Ask a Question
                </Text>
                <Pressable
                  onPress={() => setShowAskModal(false)}
                  testID="close-ask-modal"
                >
                  <Text
                    style={[styles.closeButton, { color: colors.textMuted }]}
                  >
                    ✕
                  </Text>
                </Pressable>
              </View>

              <Text
                style={[
                  styles.modalDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Your question will be posted anonymously. Other parents can
                share their experiences to help.
              </Text>

              <TextInput
                style={[
                  styles.questionInput,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g., Is 14 months late for first steps?"
                placeholderTextColor={colors.textMuted}
                value={questionText}
                onChangeText={setQuestionText}
                multiline
                maxLength={500}
                testID="question-input"
              />

              <Text style={[styles.charCount, { color: colors.textMuted }]}>
                {questionText.length}/500
              </Text>

              <Pressable
                style={[
                  styles.submitButton,
                  !questionText.trim() && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitQuestion}
                disabled={!questionText.trim()}
                testID="submit-question-button"
              >
                <Text style={styles.submitButtonText}>Submit Anonymously</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  askButton: {
    backgroundColor: PRIMARY_COLOR,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  askButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  questionsSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  questionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  anonymousBadge: {
    fontSize: 12,
    fontStyle: "italic",
  },
  timeAgo: {
    fontSize: 12,
  },
  questionText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },
  responsesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  responsesCount: {
    fontSize: 13,
    marginBottom: 8,
  },
  responseCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  responseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    lineHeight: 20,
  },
  disclaimerSection: {
    padding: 20,
    marginTop: 12,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
    textAlign: "center",
  },
  disabledContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  disabledIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  disabledTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  disabledDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  enableButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  enableButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    fontSize: 24,
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  questionInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    textAlignVertical: "top",
    fontSize: 15,
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
