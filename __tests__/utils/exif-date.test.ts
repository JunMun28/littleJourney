import { extractDateFromExif, type ExifData } from "@/utils/exif-date";

describe("extractDateFromExif", () => {
  it("returns null for undefined exif", () => {
    expect(extractDateFromExif(undefined)).toBeNull();
  });

  it("returns null for null exif", () => {
    expect(extractDateFromExif(null)).toBeNull();
  });

  it("returns null for empty exif object", () => {
    expect(extractDateFromExif({})).toBeNull();
  });

  it("extracts date from DateTimeOriginal (EXIF format)", () => {
    const exif: ExifData = {
      DateTimeOriginal: "2024:06:15 14:30:45",
    };
    expect(extractDateFromExif(exif)).toBe("2024-06-15");
  });

  it("extracts date from DateTimeDigitized when DateTimeOriginal is missing", () => {
    const exif: ExifData = {
      DateTimeDigitized: "2024:03:20 09:15:00",
    };
    expect(extractDateFromExif(exif)).toBe("2024-03-20");
  });

  it("extracts date from DateTime as fallback", () => {
    const exif: ExifData = {
      DateTime: "2023:12:25 18:00:00",
    };
    expect(extractDateFromExif(exif)).toBe("2023-12-25");
  });

  it("prefers DateTimeOriginal over DateTimeDigitized and DateTime", () => {
    const exif: ExifData = {
      DateTimeOriginal: "2024:01:01 10:00:00",
      DateTimeDigitized: "2024:02:02 10:00:00",
      DateTime: "2024:03:03 10:00:00",
    };
    expect(extractDateFromExif(exif)).toBe("2024-01-01");
  });

  it("handles ISO format dates", () => {
    const exif: ExifData = {
      DateTimeOriginal: "2024-06-15T14:30:45.000Z",
    };
    expect(extractDateFromExif(exif)).toBe("2024-06-15");
  });

  it("returns null for invalid date string", () => {
    const exif: ExifData = {
      DateTimeOriginal: "invalid-date",
    };
    expect(extractDateFromExif(exif)).toBeNull();
  });

  it("returns null for date resulting in Invalid Date", () => {
    const exif: ExifData = {
      DateTimeOriginal: "not a date at all",
    };
    expect(extractDateFromExif(exif)).toBeNull();
  });
});
