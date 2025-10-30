/**
 * Main Application Utilities
 * Helper functions and utilities for the main component
 * 
 * Note: This file provides utility functions that can be used in the main component.
 * The actual React component remains in index.html for now to maintain compatibility
 * with the inline JSX and Babel transformation.
 */

// Re-export all utilities for easy access
export * from './calculations.js';
export * from './storage.js';
export * from './data.js';
export * from './ui.js';

// Main initialization function (if needed for future migration)
export function initializeApp() {
  console.log('Health Insurance Calculator modules loaded successfully');
}
