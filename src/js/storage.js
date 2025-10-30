/**
 * Local Storage Functions
 * Handle all localStorage operations with error handling
 */

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {any} data - Data to save (will be JSON stringified)
 */
export function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
}

/**
 * Load data from localStorage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if key doesn't exist or parsing fails
 * @returns {any} Parsed data or defaultValue
 */
export function loadFromLocalStorage(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return defaultValue;
  }
}

/**
 * Clear all application data from localStorage
 */
export function clearAllData() {
  if (confirm('Are you sure you want to clear all data? This will remove all family members and plans, and cannot be undone.')) {
    localStorage.removeItem('healthcarecompare-people');
    localStorage.removeItem('healthcarecompare-plans');
    localStorage.removeItem('healthcarecompare-scenarios');
    return true;
  }
  return false;
}

/**
 * Export data as JSON file
 * @param {any} data - Data to export
 * @param {string} filename - Filename for download
 */
export function exportData(data, filename) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
