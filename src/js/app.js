/**
 * Application Bootstrap
 * This file loads all modules and makes them available globally for the Babel-transpiled code
 */

import * as Calculations from './calculations.js';
import * as Storage from './storage.js';
import * as Data from './data.js';
import * as UI from './ui.js';

// Make modules available globally for use in inline Babel code
window.HealthCareCompare = {
  // Calculation functions
  calculatePlanCost: Calculations.calculatePlanCost,
  getDetailedCostBreakdown: Calculations.getDetailedCostBreakdown,
  
  // Storage functions
  saveToLocalStorage: Storage.saveToLocalStorage,
  loadFromLocalStorage: Storage.loadFromLocalStorage,
  clearAllData: Storage.clearAllData,
  exportData: Storage.exportData,
  
  // Data functions
  createNewPerson: Data.createNewPerson,
  createNewPlan: Data.createNewPlan,
  createScenarios: Data.createScenarios,
  importPeople: Data.importPeople,
  importPlanFromJSON: Data.importPlanFromJSON,
  defaultPerson: Data.defaultPerson,
  defaultPlan: Data.defaultPlan,
  createPersonScenarios: Data.createPersonScenarios,
  
  // UI functions and components
  Icon: UI.Icon,
  ErrorBoundary: UI.ErrorBoundary,
  LLM_PROMPT: UI.LLM_PROMPT,
  copyToClipboard: UI.copyToClipboard,
  formatVisitType: UI.formatVisitType,
  SCENARIOS: UI.SCENARIOS,
  useDarkMode: UI.useDarkMode,
  initializeDarkMode: UI.initializeDarkMode,
  toggleDarkMode: UI.toggleDarkMode,
  DarkModeToggle: UI.DarkModeToggle
};

// Initialize dark mode on page load
UI.initializeDarkMode();

console.log('HealthCareCompare modules loaded and available globally');
