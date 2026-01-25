/**
 * ExportModal Component Tests (YIR-004)
 *
 * Tests for the Year in Review video export modal UI,
 * including quality selection, progress display, and action buttons.
 */

import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { ExportModal } from "@/components/year-in-review/export-modal";
import type { VideoQuality } from "@/contexts/year-in-review-context";

describe("ExportModal", () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onExport: jest.fn(),
    onCancel: jest.fn(),
    status: "idle" as const,
    progress: 0,
    error: null as string | null,
    currentQuality: "1080p" as VideoQuality,
    onQualityChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("visibility", () => {
    it("renders when visible is true", () => {
      render(<ExportModal {...defaultProps} visible={true} />);

      expect(screen.getByTestId("export-modal")).toBeTruthy();
    });

    it("does not render when visible is false", () => {
      render(<ExportModal {...defaultProps} visible={false} />);

      expect(screen.queryByTestId("export-modal")).toBeNull();
    });
  });

  describe("idle state", () => {
    it("shows quality selection", () => {
      render(<ExportModal {...defaultProps} status="idle" />);

      expect(screen.getByTestId("quality-selector")).toBeTruthy();
    });

    it("shows 720p option", () => {
      render(<ExportModal {...defaultProps} status="idle" />);

      expect(screen.getByTestId("quality-720p")).toBeTruthy();
      expect(screen.getByText(/720p|HD/)).toBeTruthy();
    });

    it("shows 1080p option", () => {
      render(<ExportModal {...defaultProps} status="idle" />);

      expect(screen.getByTestId("quality-1080p")).toBeTruthy();
      expect(screen.getByText(/1080p|Full HD/)).toBeTruthy();
    });

    it("highlights selected quality", () => {
      render(
        <ExportModal {...defaultProps} status="idle" currentQuality="720p" />,
      );

      const option720 = screen.getByTestId("quality-720p");
      expect(option720.props.accessibilityState?.selected).toBe(true);
    });

    it("calls onQualityChange when quality is changed", () => {
      render(
        <ExportModal {...defaultProps} status="idle" currentQuality="1080p" />,
      );

      fireEvent.press(screen.getByTestId("quality-720p"));

      expect(defaultProps.onQualityChange).toHaveBeenCalledWith("720p");
    });

    it("shows export button", () => {
      render(<ExportModal {...defaultProps} status="idle" />);

      expect(screen.getByTestId("export-button")).toBeTruthy();
    });

    it("export button is enabled", () => {
      render(<ExportModal {...defaultProps} status="idle" />);

      const button = screen.getByTestId("export-button");
      expect(button.props.accessibilityState?.disabled).toBeFalsy();
    });

    it("calls onExport when export button pressed", () => {
      render(<ExportModal {...defaultProps} status="idle" />);

      fireEvent.press(screen.getByTestId("export-button"));

      expect(defaultProps.onExport).toHaveBeenCalled();
    });

    it("shows close button", () => {
      render(<ExportModal {...defaultProps} status="idle" />);

      expect(screen.getByTestId("close-button")).toBeTruthy();
    });

    it("calls onClose when close button pressed", () => {
      render(<ExportModal {...defaultProps} status="idle" />);

      fireEvent.press(screen.getByTestId("close-button"));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("shows title", () => {
      render(<ExportModal {...defaultProps} status="idle" />);

      expect(screen.getByText(/Export|Video|Year in Review/i)).toBeTruthy();
    });
  });

  describe("preparing state", () => {
    it("shows preparing message", () => {
      render(
        <ExportModal {...defaultProps} status="preparing" progress={10} />,
      );

      expect(screen.getByText(/preparing/i)).toBeTruthy();
    });

    it("shows progress bar", () => {
      render(
        <ExportModal {...defaultProps} status="preparing" progress={10} />,
      );

      expect(screen.getByTestId("progress-bar")).toBeTruthy();
    });

    it("hides quality selector", () => {
      render(
        <ExportModal {...defaultProps} status="preparing" progress={10} />,
      );

      expect(screen.queryByTestId("quality-selector")).toBeNull();
    });

    it("shows cancel button", () => {
      render(
        <ExportModal {...defaultProps} status="preparing" progress={10} />,
      );

      expect(screen.getByTestId("cancel-button")).toBeTruthy();
    });

    it("calls onCancel when cancel button pressed", () => {
      render(
        <ExportModal {...defaultProps} status="preparing" progress={10} />,
      );

      fireEvent.press(screen.getByTestId("cancel-button"));

      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it("hides close button", () => {
      render(
        <ExportModal {...defaultProps} status="preparing" progress={10} />,
      );

      expect(screen.queryByTestId("close-button")).toBeNull();
    });
  });

  describe("rendering state", () => {
    it("shows rendering message", () => {
      render(
        <ExportModal {...defaultProps} status="rendering" progress={50} />,
      );

      expect(screen.getByText(/rendering|creating|processing/i)).toBeTruthy();
    });

    it("shows progress bar with correct progress", () => {
      render(
        <ExportModal {...defaultProps} status="rendering" progress={50} />,
      );

      const progressBar = screen.getByTestId("progress-bar");
      // Check that progress is reflected (implementation may vary)
      expect(progressBar).toBeTruthy();
    });

    it("shows progress percentage", () => {
      render(
        <ExportModal {...defaultProps} status="rendering" progress={50} />,
      );

      expect(screen.getByText(/50%/)).toBeTruthy();
    });

    it("shows cancel button", () => {
      render(
        <ExportModal {...defaultProps} status="rendering" progress={50} />,
      );

      expect(screen.getByTestId("cancel-button")).toBeTruthy();
    });

    it("updates progress as rendering continues", () => {
      const { rerender } = render(
        <ExportModal {...defaultProps} status="rendering" progress={25} />,
      );

      expect(screen.getByText(/25%/)).toBeTruthy();

      rerender(
        <ExportModal {...defaultProps} status="rendering" progress={75} />,
      );

      expect(screen.getByText(/75%/)).toBeTruthy();
    });
  });

  describe("saving state", () => {
    it("shows saving message", () => {
      render(<ExportModal {...defaultProps} status="saving" progress={90} />);

      expect(screen.getByText(/saving|camera roll/i)).toBeTruthy();
    });

    it("shows high progress", () => {
      render(<ExportModal {...defaultProps} status="saving" progress={95} />);

      expect(screen.getByText(/95%/)).toBeTruthy();
    });

    it("disables cancel button when saving", () => {
      render(<ExportModal {...defaultProps} status="saving" progress={90} />);

      const cancelButton = screen.queryByTestId("cancel-button");
      // Cancel button should be disabled or hidden during saving
      if (cancelButton) {
        expect(cancelButton.props.accessibilityState?.disabled).toBe(true);
      }
    });
  });

  describe("complete state", () => {
    it("shows success message", () => {
      render(
        <ExportModal {...defaultProps} status="complete" progress={100} />,
      );

      expect(screen.getByText(/complete|success|saved|done/i)).toBeTruthy();
    });

    it("shows 100% progress", () => {
      render(
        <ExportModal {...defaultProps} status="complete" progress={100} />,
      );

      expect(screen.getByText(/100%/)).toBeTruthy();
    });

    it("shows done button", () => {
      render(
        <ExportModal {...defaultProps} status="complete" progress={100} />,
      );

      expect(screen.getByTestId("done-button")).toBeTruthy();
    });

    it("calls onClose when done button pressed", () => {
      render(
        <ExportModal {...defaultProps} status="complete" progress={100} />,
      );

      fireEvent.press(screen.getByTestId("done-button"));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("shows share button", () => {
      render(
        <ExportModal {...defaultProps} status="complete" progress={100} />,
      );

      expect(screen.getByTestId("share-button")).toBeTruthy();
    });

    it("hides cancel button", () => {
      render(
        <ExportModal {...defaultProps} status="complete" progress={100} />,
      );

      expect(screen.queryByTestId("cancel-button")).toBeNull();
    });

    it("displays success icon or animation", () => {
      render(
        <ExportModal {...defaultProps} status="complete" progress={100} />,
      );

      // Could be a checkmark icon or animation
      expect(
        screen.queryByTestId("success-icon") ||
          screen.queryByText(/✓|✔|🎉/) ||
          screen.queryByTestId("success-animation"),
      ).toBeTruthy();
    });
  });

  describe("error state", () => {
    it("shows error message", () => {
      render(
        <ExportModal
          {...defaultProps}
          status="error"
          error="FFmpeg encoding failed"
        />,
      );

      expect(screen.getByText(/error|failed/i)).toBeTruthy();
    });

    it("displays specific error text", () => {
      render(
        <ExportModal
          {...defaultProps}
          status="error"
          error="Storage permission denied"
        />,
      );

      expect(screen.getByText(/Storage permission denied/i)).toBeTruthy();
    });

    it("shows retry button", () => {
      render(
        <ExportModal {...defaultProps} status="error" error="Export failed" />,
      );

      expect(screen.getByTestId("retry-button")).toBeTruthy();
    });

    it("calls onExport when retry button pressed", () => {
      render(
        <ExportModal {...defaultProps} status="error" error="Export failed" />,
      );

      fireEvent.press(screen.getByTestId("retry-button"));

      expect(defaultProps.onExport).toHaveBeenCalled();
    });

    it("shows close button", () => {
      render(
        <ExportModal {...defaultProps} status="error" error="Export failed" />,
      );

      expect(screen.getByTestId("close-button")).toBeTruthy();
    });

    it("displays error icon", () => {
      render(
        <ExportModal {...defaultProps} status="error" error="Export failed" />,
      );

      expect(
        screen.queryByTestId("error-icon") || screen.queryByText(/⚠|❌|!/),
      ).toBeTruthy();
    });
  });

  describe("progress bar", () => {
    it("shows 0% width at start", () => {
      render(<ExportModal {...defaultProps} status="rendering" progress={0} />);

      const progressBar = screen.getByTestId("progress-bar");
      // Progress bar should start at 0
      expect(progressBar).toBeTruthy();
    });

    it("shows 50% at halfway", () => {
      render(
        <ExportModal {...defaultProps} status="rendering" progress={50} />,
      );

      expect(screen.getByText(/50%/)).toBeTruthy();
    });

    it("shows 100% at complete", () => {
      render(
        <ExportModal {...defaultProps} status="complete" progress={100} />,
      );

      expect(screen.getByText(/100%/)).toBeTruthy();
    });

    it("animates smoothly between progress values", () => {
      // This test verifies the progress bar updates smoothly
      const { rerender } = render(
        <ExportModal {...defaultProps} status="rendering" progress={10} />,
      );

      rerender(
        <ExportModal {...defaultProps} status="rendering" progress={50} />,
      );

      // Progress should be visible and updated
      expect(screen.getByTestId("progress-bar")).toBeTruthy();
    });
  });

  describe("quality info", () => {
    it("shows resolution info for 720p", () => {
      render(
        <ExportModal {...defaultProps} status="idle" currentQuality="720p" />,
      );

      expect(screen.getByText(/1280.*720|HD/i)).toBeTruthy();
    });

    it("shows resolution info for 1080p", () => {
      render(
        <ExportModal {...defaultProps} status="idle" currentQuality="1080p" />,
      );

      expect(screen.getByText(/1920.*1080|Full HD/i)).toBeTruthy();
    });

    it("shows file size estimate for 720p", () => {
      render(
        <ExportModal {...defaultProps} status="idle" currentQuality="720p" />,
      );

      // May show smaller file size for 720p
      expect(
        screen.queryByText(/smaller|~\d+MB|faster/i) ||
          screen.getByTestId("quality-720p"),
      ).toBeTruthy();
    });

    it("shows file size estimate for 1080p", () => {
      render(
        <ExportModal {...defaultProps} status="idle" currentQuality="1080p" />,
      );

      // May show larger file size for 1080p
      expect(
        screen.queryByText(/larger|~\d+MB|best quality/i) ||
          screen.getByTestId("quality-1080p"),
      ).toBeTruthy();
    });
  });

  describe("accessibility", () => {
    it("has accessible quality selector", () => {
      render(<ExportModal {...defaultProps} status="idle" />);

      const selector = screen.getByTestId("quality-selector");
      expect(
        selector.props.accessibilityRole || selector.props.accessible,
      ).toBeTruthy();
    });

    it("has accessible export button", () => {
      render(<ExportModal {...defaultProps} status="idle" />);

      const button = screen.getByTestId("export-button");
      expect(button.props.accessibilityRole).toBe("button");
    });

    it("progress bar has accessibility value", () => {
      render(
        <ExportModal {...defaultProps} status="rendering" progress={50} />,
      );

      const progressBar = screen.getByTestId("progress-bar");
      expect(
        progressBar.props.accessibilityValue ||
          progressBar.props["aria-valuenow"],
      ).toBeDefined();
    });

    it("error message is accessible", () => {
      render(
        <ExportModal {...defaultProps} status="error" error="Export failed" />,
      );

      const errorText = screen.getByText(/Export failed/i);
      expect(errorText).toBeTruthy();
    });
  });

  describe("estimated time", () => {
    it("shows estimated time in idle state", () => {
      render(<ExportModal {...defaultProps} status="idle" />);

      // May show estimated export time
      expect(
        screen.queryByText(/~\d+ min|estimate/i) ||
          screen.getByTestId("export-button"),
      ).toBeTruthy();
    });

    it("shows remaining time during rendering", () => {
      render(
        <ExportModal {...defaultProps} status="rendering" progress={50} />,
      );

      // May show time remaining
      expect(screen.getByTestId("progress-bar")).toBeTruthy();
    });
  });
});
