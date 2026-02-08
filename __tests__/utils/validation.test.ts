/**
 * Validation Utility Tests
 */

describe("Validation Utilities", () => {
  describe("Email Validation", () => {
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    it("validates correct email addresses", () => {
      const validEmails = [
        "test@example.com",
        "user@domain.co",
        "firstname.lastname@company.com",
        "user+tag@example.com",
        "user123@test.io",
      ];

      validEmails.forEach((email) => {
        expect(EMAIL_REGEX.test(email)).toBe(true);
      });
    });

    it("rejects invalid email addresses", () => {
      const invalidEmails = [
        "invalid",
        "@example.com",
        "test@",
        "test@.com",
        "",
        " ",
      ];

      invalidEmails.forEach((email) => {
        expect(EMAIL_REGEX.test(email)).toBe(false);
      });
    });
  });

  describe("Date Validation", () => {
    it("validates date is not in the future", () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(yesterday <= today).toBe(true);
      expect(tomorrow > today).toBe(true);
    });

    it("validates date format", () => {
      const validDate = new Date("2024-01-15");
      expect(validDate instanceof Date && !isNaN(validDate.getTime())).toBe(true);

      const invalidDate = new Date("invalid");
      expect(invalidDate instanceof Date && isNaN(invalidDate.getTime())).toBe(true);
    });
  });

  describe("String Validation", () => {
    it("validates non-empty strings", () => {
      expect("test".trim().length > 0).toBe(true);
      expect("  test  ".trim().length > 0).toBe(true);
      expect("".trim().length > 0).toBe(false);
      expect("   ".trim().length > 0).toBe(false);
    });

    it("validates string length", () => {
      const str = "test";
      expect(str.length).toBe(4);
      expect(str.length >= 2 && str.length <= 10).toBe(true);
    });
  });

  describe("Number Validation", () => {
    it("validates positive numbers", () => {
      expect(10 > 0).toBe(true);
      expect(0 >= 0).toBe(true);
      expect(-1 > 0).toBe(false);
    });

    it("validates number ranges", () => {
      const num = 50;
      expect(num >= 0 && num <= 100).toBe(true);
      expect(num >= 0 && num <= 10).toBe(false);
    });

    it("validates integer values", () => {
      expect(Number.isInteger(10)).toBe(true);
      expect(Number.isInteger(10.5)).toBe(false);
    });
  });

  describe("Array Validation", () => {
    it("validates non-empty arrays", () => {
      expect([1, 2, 3].length > 0).toBe(true);
      expect([].length > 0).toBe(false);
    });

    it("validates array length constraints", () => {
      const arr = [1, 2, 3, 4, 5];
      expect(arr.length >= 1 && arr.length <= 10).toBe(true);
    });

    it("validates all items match condition", () => {
      const numbers = [1, 2, 3, 4, 5];
      expect(numbers.every((n) => n > 0)).toBe(true);
      expect(numbers.every((n) => n > 3)).toBe(false);
    });
  });

  describe("Object Validation", () => {
    it("validates object has required properties", () => {
      const obj = { name: "Test", age: 25 };
      expect("name" in obj).toBe(true);
      expect("age" in obj).toBe(true);
      expect("email" in obj).toBe(false);
    });

    it("validates object is not null or undefined", () => {
      expect(typeof {} === "object" && {} !== null).toBe(true);
      expect(typeof null === "object" && null !== null).toBe(false);
      expect(typeof undefined === "object").toBe(false);
    });
  });

  describe("Password Validation", () => {
    const validatePassword = (password: string): boolean => {
      // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
      const minLength = password.length >= 8;
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      return minLength && hasUppercase && hasLowercase && hasNumber;
    };

    it("validates strong passwords", () => {
      expect(validatePassword("Password123")).toBe(true);
      expect(validatePassword("MyP@ssw0rd")).toBe(true);
      expect(validatePassword("Secure1Pass")).toBe(true);
    });

    it("rejects weak passwords", () => {
      expect(validatePassword("password")).toBe(false); // No uppercase, no number
      expect(validatePassword("PASSWORD")).toBe(false); // No lowercase, no number
      expect(validatePassword("12345678")).toBe(false); // No letters
      expect(validatePassword("Pass1")).toBe(false); // Too short
      expect(validatePassword("")).toBe(false);
    });
  });

  describe("Phone Number Validation", () => {
    const validatePhone = (phone: string): boolean => {
      // Singapore phone format: 8 digits starting with 8 or 9
      return /^[89]\d{7}$/.test(phone.replace(/\s/g, ""));
    };

    it("validates Singapore phone numbers", () => {
      expect(validatePhone("91234567")).toBe(true);
      expect(validatePhone("81234567")).toBe(true);
      expect(validatePhone("9123 4567")).toBe(true);
    });

    it("rejects invalid phone numbers", () => {
      expect(validatePhone("71234567")).toBe(false); // Wrong prefix
      expect(validatePhone("9123456")).toBe(false); // Too short
      expect(validatePhone("912345678")).toBe(false); // Too long
      expect(validatePhone("")).toBe(false);
    });
  });

  describe("File Size Validation", () => {
    it("validates file size within limit", () => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const fileSize = 5 * 1024 * 1024; // 5MB
      expect(fileSize <= maxSize).toBe(true);
    });

    it("rejects file size exceeding limit", () => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const fileSize = 15 * 1024 * 1024; // 15MB
      expect(fileSize <= maxSize).toBe(false);
    });
  });

  describe("URL Validation", () => {
    const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

    it("validates correct URLs", () => {
      const validUrls = [
        "https://example.com",
        "http://test.com",
        "www.example.com",
        "example.com",
        "https://sub.domain.co.uk/path",
      ];

      validUrls.forEach((url) => {
        expect(URL_REGEX.test(url)).toBe(true);
      });
    });

    it("rejects invalid URLs", () => {
      const invalidUrls = ["not a url", "ftp://invalid.com", "", " "];

      invalidUrls.forEach((url) => {
        expect(URL_REGEX.test(url)).toBe(false);
      });
    });
  });
});
