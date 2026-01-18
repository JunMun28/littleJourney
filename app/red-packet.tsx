import { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { Stack } from "expo-router";
import { useRedPacket, type RedPacket } from "@/contexts/red-packet-context";
import { useChild } from "@/contexts/child-context";

const CNY_RED = "#C41E3A";
const CNY_GOLD = "#FFD700";

export default function RedPacketScreen() {
  const { child } = useChild();
  const {
    addPacket,
    removePacket,
    getTotalForYear,
    getPacketsForYear,
    getYearsWithPackets,
  } = useRedPacket();

  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [giverName, setGiverName] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const years = getYearsWithPackets();
  const currentYear = new Date().getFullYear();

  // Add current year to tabs if not present
  const displayYears =
    years.length > 0 && years.includes(currentYear)
      ? years
      : [currentYear, ...years.filter((y) => y !== currentYear)];

  const yearPackets = getPacketsForYear(selectedYear);
  const yearTotal = getTotalForYear(selectedYear);

  const handleAddPacket = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }
    if (!giverName.trim()) {
      Alert.alert("Missing Name", "Please enter the giver's name.");
      return;
    }

    addPacket({
      amount: parsedAmount,
      giverName: giverName.trim(),
      childId: child?.id ?? "unknown",
      year: selectedYear,
      receivedAt: new Date().toISOString(),
      notes: notes.trim() || undefined,
    });

    // Reset form
    setAmount("");
    setGiverName("");
    setNotes("");
    setShowAddModal(false);
  };

  const handleDeletePacket = (packetId: string) => {
    Alert.alert(
      "Delete Record",
      "Are you sure you want to delete this ang bao record?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => removePacket(packetId),
        },
      ],
    );
  };

  const formatCurrency = (amount: number) => {
    return `S$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-SG", {
      day: "numeric",
      month: "short",
    });
  };

  const renderPacketItem = ({ item }: { item: RedPacket }) => (
    <TouchableOpacity
      style={styles.packetCard}
      onLongPress={() => handleDeletePacket(item.id)}
      testID={`packet-${item.id}`}
    >
      <View style={styles.packetMain}>
        <View style={styles.packetIcon}>
          <Text style={styles.packetEmoji}>🧧</Text>
        </View>
        <View style={styles.packetInfo}>
          <Text style={styles.packetGiver}>{item.giverName}</Text>
          <Text style={styles.packetDate}>{formatDate(item.receivedAt)}</Text>
          {item.notes && (
            <Text style={styles.packetNotes} numberOfLines={1}>
              {item.notes}
            </Text>
          )}
        </View>
        <Text style={styles.packetAmount}>{formatCurrency(item.amount)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderYearTab = (year: number) => (
    <TouchableOpacity
      key={year}
      style={[styles.yearTab, selectedYear === year && styles.yearTabActive]}
      onPress={() => setSelectedYear(year)}
      testID={`year-tab-${year}`}
    >
      <Text
        style={[
          styles.yearTabText,
          selectedYear === year && styles.yearTabTextActive,
        ]}
      >
        {year}
      </Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Collected ({selectedYear})</Text>
        <Text style={styles.totalAmount}>{formatCurrency(yearTotal)}</Text>
        <Text style={styles.totalCount}>
          {yearPackets.length} ang bao{yearPackets.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <View style={styles.yearTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {displayYears.map(renderYearTab)}
        </ScrollView>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🧧</Text>
      <Text style={styles.emptyTitle}>No Ang Bao Recorded</Text>
      <Text style={styles.emptySubtitle}>
        Track your child&apos;s red packets for {selectedYear}
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
        testID="empty-add-button"
      >
        <Text style={styles.addButtonText}>Add Ang Bao</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Ang Bao Tracker",
          headerStyle: { backgroundColor: CNY_RED },
          headerTintColor: CNY_GOLD,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              testID="header-add-button"
            >
              <Text style={styles.headerAddButton}>+ Add</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <FlatList
        data={yearPackets}
        keyExtractor={(item) => item.id}
        renderItem={renderPacketItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB for adding when packets exist */}
      {yearPackets.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddModal(true)}
          testID="fab-add-button"
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Add Ang Bao Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Ang Bao</Text>
            <TouchableOpacity
              onPress={handleAddPacket}
              testID="save-packet-button"
            >
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (S$) *</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="88.00"
                placeholderTextColor="#999"
                testID="amount-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>From *</Text>
              <TextInput
                style={styles.input}
                value={giverName}
                onChangeText={setGiverName}
                placeholder="e.g., Grandma, Uncle, Ah Ma"
                placeholderTextColor="#999"
                testID="giver-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g., CNY visiting day 1"
                placeholderTextColor="#999"
                multiline
                testID="notes-input"
              />
            </View>

            <View style={styles.privacyNote}>
              <Text style={styles.privacyIcon}>🔒</Text>
              <Text style={styles.privacyText}>
                This information is private and will not be shared with family
                members.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8F0",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  headerSection: {
    marginBottom: 16,
  },
  totalCard: {
    backgroundColor: CNY_RED,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 42,
    fontWeight: "bold",
    color: CNY_GOLD,
  },
  totalCount: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  yearTabs: {
    flexDirection: "row",
  },
  yearTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(196, 30, 58, 0.1)",
    marginRight: 8,
  },
  yearTabActive: {
    backgroundColor: CNY_RED,
  },
  yearTabText: {
    fontSize: 14,
    color: CNY_RED,
    fontWeight: "500",
  },
  yearTabTextActive: {
    color: "#fff",
  },
  packetCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  packetMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  packetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(196, 30, 58, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  packetEmoji: {
    fontSize: 24,
  },
  packetInfo: {
    flex: 1,
  },
  packetGiver: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  packetDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  packetNotes: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
    fontStyle: "italic",
  },
  packetAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: CNY_RED,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyEmoji: {
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
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: CNY_RED,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerAddButton: {
    color: CNY_GOLD,
    fontSize: 16,
    fontWeight: "600",
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
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: CNY_RED,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: CNY_GOLD,
  },
  modalCancel: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  modalSave: {
    fontSize: 16,
    fontWeight: "600",
    color: CNY_GOLD,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  notesInput: {
    height: 80,
    textAlignVertical: "top",
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(196, 30, 58, 0.05)",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  privacyIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: CNY_RED,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: CNY_GOLD,
    fontWeight: "300",
    marginTop: -2,
  },
});
