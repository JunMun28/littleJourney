/**
 * EXIF date extraction utility for photo entries
 * PRD ref: Section 3.4 (EXIF Date Detection)
 */

export interface ExifData {
  DateTimeOriginal?: string;
  DateTimeDigitized?: string;
  DateTime?: string;
  [key: string]: unknown;
}

/**
 * Extracts date from EXIF metadata in ISO date format (YYYY-MM-DD)
 *
 * EXIF dates can be in format:
 * - "YYYY:MM:DD HH:mm:ss" (standard EXIF format)
 * - "YYYY-MM-DDTHH:mm:ss.sssZ" (ISO format)
 *
 * Priority order: DateTimeOriginal > DateTimeDigitized > DateTime
 *
 * @param exif - EXIF metadata object from image picker
 * @returns ISO date string (YYYY-MM-DD) or null if no valid date found
 */
export function extractDateFromExif(
  exif: ExifData | null | undefined,
): string | null {
  if (!exif) return null;

  // Try fields in order of preference
  const dateString =
    exif.DateTimeOriginal || exif.DateTimeDigitized || exif.DateTime;

  if (!dateString) return null;

  try {
    // Handle EXIF format "YYYY:MM:DD HH:mm:ss"
    let dateValue: Date;
    if (dateString.includes(":") && dateString.includes(" ")) {
      // Standard EXIF format: "2024:06:15 14:30:45"
      const [datePart] = dateString.split(" ");
      const [year, month, day] = datePart.split(":");
      if (year && month && day) {
        dateValue = new Date(`${year}-${month}-${day}`);
      } else {
        return null;
      }
    } else {
      // Try parsing as ISO format
      dateValue = new Date(dateString);
    }

    // Validate the date
    if (isNaN(dateValue.getTime())) {
      return null;
    }

    // Return ISO date string (YYYY-MM-DD)
    return dateValue.toISOString().split("T")[0];
  } catch {
    return null;
  }
}
