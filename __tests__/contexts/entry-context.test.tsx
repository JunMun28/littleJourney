import { render, screen, act, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import {
  EntryProvider,
  useEntries,
  type Entry,
  type EntryType,
} from "@/contexts/entry-context";

function TestConsumer() {
  const { entries, addEntry, updateEntry, deleteEntry } = useEntries();
  return (
    <>
      <Text testID="count">{entries.length}</Text>
      <Text testID="first-caption">{entries[0]?.caption ?? "none"}</Text>
      <Text testID="first-type">{entries[0]?.type ?? "none"}</Text>
      <Text testID="first-media-count">
        {entries[0]?.mediaUris?.length ?? 0}
      </Text>
      <Text
        testID="add-photo-entry"
        onPress={() =>
          addEntry({
            type: "photo",
            mediaUris: ["file:///photo1.jpg"],
            caption: "First steps!",
            date: "2024-06-15",
          })
        }
      >
        Add Photo
      </Text>
      <Text
        testID="add-video-entry"
        onPress={() =>
          addEntry({
            type: "video",
            mediaUris: ["file:///video1.mp4"],
            caption: "Baby laughing",
            date: "2024-06-16",
          })
        }
      >
        Add Video
      </Text>
      <Text
        testID="add-text-entry"
        onPress={() =>
          addEntry({
            type: "text",
            caption: "Slept through the night!",
            date: "2024-06-17",
          })
        }
      >
        Add Text
      </Text>
      <Text
        testID="add-multi-photo"
        onPress={() =>
          addEntry({
            type: "photo",
            mediaUris: ["file:///photo1.jpg", "file:///photo2.jpg"],
            caption: "Park day",
            date: "2024-06-18",
          })
        }
      >
        Add Multi Photo
      </Text>
      <Text
        testID="update-first"
        onPress={() => {
          if (entries[0]) {
            updateEntry(entries[0].id, { caption: "Updated caption" });
          }
        }}
      >
        Update First
      </Text>
      <Text
        testID="delete-first"
        onPress={() => {
          if (entries[0]) {
            deleteEntry(entries[0].id);
          }
        }}
      >
        Delete First
      </Text>
    </>
  );
}

describe("EntryContext", () => {
  it("provides empty entries initially", () => {
    render(
      <EntryProvider>
        <TestConsumer />
      </EntryProvider>,
    );

    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("adds a photo entry", async () => {
    render(
      <EntryProvider>
        <TestConsumer />
      </EntryProvider>,
    );

    await act(async () => {
      screen.getByTestId("add-photo-entry").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });
    expect(screen.getByTestId("first-type")).toHaveTextContent("photo");
    expect(screen.getByTestId("first-caption")).toHaveTextContent(
      "First steps!",
    );
    expect(screen.getByTestId("first-media-count")).toHaveTextContent("1");
  });

  it("adds a video entry", async () => {
    render(
      <EntryProvider>
        <TestConsumer />
      </EntryProvider>,
    );

    await act(async () => {
      screen.getByTestId("add-video-entry").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });
    expect(screen.getByTestId("first-type")).toHaveTextContent("video");
    expect(screen.getByTestId("first-caption")).toHaveTextContent(
      "Baby laughing",
    );
  });

  it("adds a text-only entry", async () => {
    render(
      <EntryProvider>
        <TestConsumer />
      </EntryProvider>,
    );

    await act(async () => {
      screen.getByTestId("add-text-entry").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });
    expect(screen.getByTestId("first-type")).toHaveTextContent("text");
    expect(screen.getByTestId("first-caption")).toHaveTextContent(
      "Slept through the night!",
    );
    expect(screen.getByTestId("first-media-count")).toHaveTextContent("0");
  });

  it("supports multiple photos in a single entry (carousel)", async () => {
    render(
      <EntryProvider>
        <TestConsumer />
      </EntryProvider>,
    );

    await act(async () => {
      screen.getByTestId("add-multi-photo").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("first-media-count")).toHaveTextContent("2");
    });
  });

  it("updates an existing entry", async () => {
    render(
      <EntryProvider>
        <TestConsumer />
      </EntryProvider>,
    );

    // Add entry first
    await act(async () => {
      screen.getByTestId("add-photo-entry").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("first-caption")).toHaveTextContent(
        "First steps!",
      );
    });

    // Update the entry
    await act(async () => {
      screen.getByTestId("update-first").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("first-caption")).toHaveTextContent(
        "Updated caption",
      );
    });
  });

  it("deletes an entry", async () => {
    render(
      <EntryProvider>
        <TestConsumer />
      </EntryProvider>,
    );

    // Add entry first
    await act(async () => {
      screen.getByTestId("add-photo-entry").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });

    // Delete the entry
    await act(async () => {
      screen.getByTestId("delete-first").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("0");
    });
  });

  it("throws when useEntries is used outside EntryProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    expect(() => render(<TestConsumer />)).toThrow(
      "useEntries must be used within an EntryProvider",
    );

    consoleSpy.mockRestore();
  });
});
