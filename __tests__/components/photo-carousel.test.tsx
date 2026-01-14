import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { PhotoCarousel } from "@/components/photo-carousel";

describe("PhotoCarousel", () => {
  const mockImages = [
    "file://image1.jpg",
    "file://image2.jpg",
    "file://image3.jpg",
  ];

  it("renders single image without dot indicators", () => {
    const { queryByTestId, getByTestId } = render(
      <PhotoCarousel images={["file://single.jpg"]} />,
    );

    expect(getByTestId("carousel-image-0")).toBeTruthy();
    expect(queryByTestId("dot-indicator-0")).toBeNull();
  });

  it("renders multiple images with dot indicators", () => {
    const { getByTestId, getAllByTestId } = render(
      <PhotoCarousel images={mockImages} />,
    );

    expect(getByTestId("carousel-image-0")).toBeTruthy();
    const dots = getAllByTestId(/dot-indicator-/);
    expect(dots).toHaveLength(3);
  });

  it("shows first dot as active initially", () => {
    const { getByTestId } = render(<PhotoCarousel images={mockImages} />);

    const firstDot = getByTestId("dot-indicator-0");
    const secondDot = getByTestId("dot-indicator-1");

    // Active dot should have opacity 1, inactive should have 0.4
    // Style is an array, so check that it contains the expected opacity
    expect(firstDot.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 1 })]),
    );
    expect(secondDot.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 0.4 })]),
    );
  });

  it("calls onImagePress when image is tapped", () => {
    const onImagePress = jest.fn();
    const { getByTestId } = render(
      <PhotoCarousel images={mockImages} onImagePress={onImagePress} />,
    );

    fireEvent.press(getByTestId("carousel-image-0"));
    expect(onImagePress).toHaveBeenCalledWith(0);
  });

  it("renders with custom aspectRatio", () => {
    const { getByTestId } = render(
      <PhotoCarousel images={["file://image.jpg"]} aspectRatio={16 / 9} />,
    );

    const scrollView = getByTestId("carousel-scroll-view");
    expect(scrollView).toBeTruthy();
  });
});
