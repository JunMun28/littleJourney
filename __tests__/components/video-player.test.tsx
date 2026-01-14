import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { VideoPlayer } from "@/components/video-player";

// Mock expo-av Video component
jest.mock("expo-av", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Video: React.forwardRef(
      (
        { testID, style, onPlaybackStatusUpdate, ...props }: any,
        ref: React.Ref<any>,
      ) => {
        React.useImperativeHandle(ref, () => ({
          playAsync: jest.fn(),
          pauseAsync: jest.fn(),
        }));
        return (
          <View
            testID={testID || "mock-video"}
            style={style}
            {...props}
            accessibilityLabel="video"
          />
        );
      },
    ),
    ResizeMode: {
      CONTAIN: "contain",
      COVER: "cover",
    },
  };
});

describe("VideoPlayer", () => {
  const mockVideoUri = "file://test-video.mp4";

  it("renders video component", () => {
    const { getByTestId } = render(<VideoPlayer uri={mockVideoUri} />);
    expect(getByTestId("video-player")).toBeTruthy();
  });

  it("renders play button overlay when not playing", () => {
    const { getByTestId } = render(<VideoPlayer uri={mockVideoUri} />);
    expect(getByTestId("play-button")).toBeTruthy();
  });

  it("shows controls overlay", () => {
    const { getByTestId } = render(<VideoPlayer uri={mockVideoUri} />);
    expect(getByTestId("controls-overlay")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <VideoPlayer uri={mockVideoUri} onPress={onPress} />,
    );

    fireEvent.press(getByTestId("video-container"));
    expect(onPress).toHaveBeenCalled();
  });

  it("renders with custom aspectRatio", () => {
    const { getByTestId } = render(
      <VideoPlayer uri={mockVideoUri} aspectRatio={16 / 9} />,
    );

    const container = getByTestId("video-container");
    expect(container).toBeTruthy();
  });
});
