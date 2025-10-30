# JavaScript Module Structure

The JavaScript code has been split into separate modules for better maintainability:

## Module Files

### `/js/calculations.js`
Contains all healthcare cost calculation functions:
- `calculatePlanCost(plan, people)` - Calculates total annual cost for a plan
- `getDetailedCostBreakdown(plan, people)` - Provides detailed cost breakdown with per-person calculations

### `/js/storage.js`
Handles all localStorage operations:
- `saveToLocalStorage(key, data)` - Save data to localStorage
- `loadFromLocalStorage(key, defaultValue)` - Load data from localStorage
- `clearAllData()` - Clear all application data
- `exportData(data, filename)` - Export data as JSON file

### `/js/data.js`
Data management and default templates:
- `createNewPerson(id, name)` - Create a new person with default values
- `createNewPlan(id, name)` - Create a new plan with default values
- `createScenarios(people)` - Create best/likely/worst case scenarios
- `importPeople(importedData, currentPeople)` - Import person/people from JSON
- `importPlanFromJSON(jsonData, premium, newId)` - Import plan from JSON
- `defaultPerson` - Default person template
- `defaultPlan` - Default plan template

### `/js/ui.js`
UI components and helper functions:
- `Icon` - Lucide icon component
- `ErrorBoundary` - React error boundary component
- `LLM_PROMPT` - Prompt text for LLM plan extraction
- `copyToClipboard(text, event)` - Copy text to clipboard with visual feedback
- `formatVisitType(visitType)` - Format visit type names for display
- `SCENARIOS` - Scenario configuration array

### `/js/app.js`
Application bootstrap that loads all modules and makes them available globally for use in the Babel-transpiled inline JSX code.

### `/js/main.js`
Utility re-exports for easy access to all module functions.

## How It Works

1. `app.js` is loaded as an ES6 module
2. It imports all other modules (calculations, storage, data, ui)
3. Makes them available via `window.HealthCareCompare` object
4. The inline `<script type="text/babel">` code destructures these functions from the global object
5. Functions are used throughout the React component

## Benefits

- **Maintainability**: Each module has a single responsibility
- **Testability**: Functions can be unit tested independently
- **Reusability**: Functions can be imported and used in other projects
- **Organization**: Related code is grouped together
- **Documentation**: Each module is self-documenting with JSDoc comments

## Future Improvements

- Convert the entire application to use a proper build system (Vite, Webpack, etc.)
- Move the inline JSX component to a separate file
- Add unit tests for each module
- Use TypeScript for better type safety
- Implement proper module bundling

Test Change 1