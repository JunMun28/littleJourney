/**
 * Calculate a child's age from their date of birth
 * Returns a human-readable age string (e.g., "2 years old", "1y 3m", "6 months old")
 */
export function getChildAge(dateOfBirth: string): string {
  const birth = new Date(dateOfBirth);
  const now = new Date();

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  if (now.getDate() < birth.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }

  if (years >= 2) {
    return `${years} years old`;
  } else if (years === 1) {
    return months > 0 ? `${years}y ${months}m` : "1 year old";
  } else {
    return `${months} month${months !== 1 ? "s" : ""} old`;
  }
}

/**
 * Get the child's age in months (for milestone tracking)
 */
export function getChildAgeInMonths(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth);
  const now = new Date();

  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  const dayAdjustment = now.getDate() < birth.getDate() ? -1 : 0;

  return years * 12 + months + dayAdjustment;
}

/**
 * Get the child's age in weeks (for early milestone tracking)
 */
export function getChildAgeInWeeks(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth);
  const now = new Date();
  const diffTime = now.getTime() - birth.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
}
