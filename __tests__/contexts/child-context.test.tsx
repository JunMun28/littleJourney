import { render, screen, act, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { ChildProvider, useChild, type Child } from "@/contexts/child-context";

function TestConsumer() {
  const { child, setChild, updateChild, clearChild } = useChild();
  return (
    <>
      <Text testID="name">{child?.name ?? "none"}</Text>
      <Text testID="dob">{child?.dateOfBirth ?? "none"}</Text>
      <Text testID="nickname">{child?.nickname ?? "none"}</Text>
      <Text testID="culture">{child?.culturalTradition ?? "none"}</Text>
      <Text
        testID="set-child"
        onPress={() =>
          setChild({
            name: "Emma",
            dateOfBirth: "2024-06-15",
          })
        }
      >
        Set Child
      </Text>
      <Text
        testID="set-child-with-nickname"
        onPress={() =>
          setChild({
            name: "Liam",
            dateOfBirth: "2024-03-20",
            nickname: "Little L",
          })
        }
      >
        Set With Nickname
      </Text>
      <Text
        testID="set-child-with-culture"
        onPress={() =>
          setChild({
            name: "Wei",
            dateOfBirth: "2024-01-10",
            culturalTradition: "chinese",
          })
        }
      >
        Set With Culture
      </Text>
      <Text testID="clear-child" onPress={() => clearChild()}>
        Clear Child
      </Text>
      <Text
        testID="update-culture"
        onPress={() => updateChild({ culturalTradition: "malay" })}
      >
        Update Culture
      </Text>
    </>
  );
}

describe("ChildContext", () => {
  it("provides null child initially", () => {
    render(
      <ChildProvider>
        <TestConsumer />
      </ChildProvider>,
    );

    expect(screen.getByTestId("name")).toHaveTextContent("none");
    expect(screen.getByTestId("dob")).toHaveTextContent("none");
  });

  it("sets child with required fields", async () => {
    render(
      <ChildProvider>
        <TestConsumer />
      </ChildProvider>,
    );

    await act(async () => {
      screen.getByTestId("set-child").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("name")).toHaveTextContent("Emma");
    });
    expect(screen.getByTestId("dob")).toHaveTextContent("2024-06-15");
    expect(screen.getByTestId("nickname")).toHaveTextContent("none");
  });

  it("sets child with optional nickname", async () => {
    render(
      <ChildProvider>
        <TestConsumer />
      </ChildProvider>,
    );

    await act(async () => {
      screen.getByTestId("set-child-with-nickname").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("name")).toHaveTextContent("Liam");
    });
    expect(screen.getByTestId("nickname")).toHaveTextContent("Little L");
  });

  it("clears child data", async () => {
    render(
      <ChildProvider>
        <TestConsumer />
      </ChildProvider>,
    );

    // Set child first
    await act(async () => {
      screen.getByTestId("set-child").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("name")).toHaveTextContent("Emma");
    });

    // Clear child
    await act(async () => {
      screen.getByTestId("clear-child").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("name")).toHaveTextContent("none");
    });
  });

  it("throws when useChild is used outside ChildProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    expect(() => render(<TestConsumer />)).toThrow(
      "useChild must be used within a ChildProvider",
    );

    consoleSpy.mockRestore();
  });

  it("sets child with cultural tradition", async () => {
    render(
      <ChildProvider>
        <TestConsumer />
      </ChildProvider>,
    );

    await act(async () => {
      screen.getByTestId("set-child-with-culture").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("name")).toHaveTextContent("Wei");
    });
    expect(screen.getByTestId("dob")).toHaveTextContent("2024-01-10");
    expect(screen.getByTestId("culture")).toHaveTextContent("chinese");
  });

  it("updates existing child with partial data", async () => {
    render(
      <ChildProvider>
        <TestConsumer />
      </ChildProvider>,
    );

    // Set child first
    await act(async () => {
      screen.getByTestId("set-child").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("name")).toHaveTextContent("Emma");
    });
    expect(screen.getByTestId("culture")).toHaveTextContent("none");

    // Update just the cultural tradition
    await act(async () => {
      screen.getByTestId("update-culture").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("culture")).toHaveTextContent("malay");
    });
    // Name should remain unchanged
    expect(screen.getByTestId("name")).toHaveTextContent("Emma");
  });
});
