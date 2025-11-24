/**
 * Validation Helper Functions
 *
 * This module contains utility functions for validating settings overrides
 * and comparing values in the Practice Settings Dashboard.
 */

/**
 * Compare two values for equality, handling arrays properly
 * @param {*} value1 - First value to compare
 * @param {*} value2 - Second value to compare
 * @returns {boolean} - True if values are equal
 */
export const valuesAreEqual = (value1, value2) => {
  if (Array.isArray(value1) && Array.isArray(value2)) {
    return JSON.stringify([...value1].sort()) === JSON.stringify([...value2].sort());
  }
  return value1 === value2;
};

/**
 * Format lock state for user-friendly display
 * @param {string} lockState - Lock state ('unlocked', 'locked-visible', 'locked-hidden')
 * @returns {string} - Formatted display string
 */
export const formatLockStateDisplay = (lockState) => {
  switch (lockState) {
    case 'unlocked': return 'Unlocked';
    case 'locked-visible': return 'Locked (Visible)';
    case 'locked-hidden': return 'Locked (Hidden)';
    default: return lockState;
  }
};

/**
 * Format value for display (handles arrays and primitives)
 * @param {*} value - Value to format
 * @returns {string} - Formatted display string
 */
export const formatValueDisplay = (value) => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value);
};

/**
 * Generate the "cannot create matching override" alert message
 * @param {*} value - The value that matches default
 * @param {string} lockState - The lock state that matches default
 * @returns {string} - Error message
 */
export const getMatchingOverrideAlertMessage = (value, lockState) => {
  return `Cannot create an override that matches the practice default.

This setting would have:
• Value: ${formatValueDisplay(value)}
• Lock State: ${formatLockStateDisplay(lockState)}

Which is the same as the practice-wide default. An override must differ from the default.`;
};
