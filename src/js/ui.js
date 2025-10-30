/**
 * UI Components and Helper Functions
 * React components and UI-related utilities
 */

import React, { useState, useEffect, useRef } from 'react';

/**
 * Dark Mode Management
 */
export function initializeDarkMode() {
  const savedTheme = localStorage.getItem('healthcarecompare-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
    return true;
  } else {
    document.documentElement.classList.remove('dark');
    return false;
  }
}

export function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('healthcarecompare-theme', isDark ? 'dark' : 'light');
  return isDark;
}

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => initializeDarkMode());
  
  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const savedTheme = localStorage.getItem('healthcarecompare-theme');
      if (!savedTheme) {
        // Only apply system preference if user hasn't set a preference
        setIsDark(e.matches);
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  const toggle = () => {
    const newIsDark = toggleDarkMode();
    setIsDark(newIsDark);
  };
  
  return [isDark, toggle];
}

/**
 * Icon component using Lucide with custom icons
 */
export const Icon = ({ name, size = 20, className = "" }) => {
  const containerRef = useRef(null);
  
  useEffect(() => {
    // Initialize Lucide icons only within this container
    if (containerRef.current && window.lucide) {
      const iconElement = containerRef.current.querySelector('[data-lucide]');
      if (iconElement) {
        // Clear any existing SVG content first
        while (iconElement.firstChild) {
          iconElement.removeChild(iconElement.firstChild);
        }
        // Recreate the icon
        window.lucide.createIcons({ nameAttr: 'data-lucide' });
      }
    }
  }, [name]); // Re-run when name changes
  
  // Custom half-filled pill icon
  if (name === 'pill-half') {
    return React.createElement('svg', {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className: className
    },
      // Define a clip path for the bottom-left half
      React.createElement('defs', {},
        React.createElement('clipPath', { id: 'half-pill-clip' },
          React.createElement('path', {
            d: 'M 8.5 8.5 L 3.5 13.5 a4.95 4.95 0 0 0 7 7 L 15.5 15.5 Z'
          })
        )
      ),
      // Fill half of the pill (left/bottom half)
      React.createElement('path', {
        d: 'm10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z',
        fill: 'currentColor',
        opacity: '0.5',
        stroke: 'none',
        clipPath: 'url(#half-pill-clip)'
      }),
      // Pill outline
      React.createElement('path', {
        d: 'm10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z'
      }),
      // Diagonal line to split the pill
      React.createElement('path', {
        d: 'm8.5 8.5 7 7'
      })
    );
  }
  
  return React.createElement('span', {
    ref: containerRef,
    style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
  },
    React.createElement('i', {
      'data-lucide': name,
      className: className,
      style: { width: size, height: size }
    })
  );
};

/**
 * Error Boundary Component
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', {
        className: 'min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-6 flex items-center justify-center'
      },
        React.createElement('div', {
          className: 'max-w-2xl w-full bg-white rounded-lg shadow-xl p-8'
        },
          React.createElement('div', {
            className: 'flex items-center gap-3 mb-4'
          },
            React.createElement('svg', {
              className: 'w-12 h-12 text-red-600',
              fill: 'none',
              stroke: 'currentColor',
              viewBox: '0 0 24 24'
            },
              React.createElement('path', {
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeWidth: 2,
                d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
              })
            ),
            React.createElement('h1', {
              className: 'text-2xl font-bold text-gray-800'
            }, 'Something went wrong')
          ),
          React.createElement('p', {
            className: 'text-gray-600 mb-4'
          }, 'We encountered an unexpected error. Don\'t worry, your data is still saved in your browser.'),
          React.createElement('div', {
            className: 'bg-gray-50 rounded p-4 mb-4'
          },
            React.createElement('p', {
              className: 'text-sm font-mono text-gray-700'
            }, this.state.error && this.state.error.toString())
          ),
          React.createElement('div', {
            className: 'flex gap-3'
          },
            React.createElement('button', {
              onClick: () => window.location.reload(),
              className: 'flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition'
            },
              React.createElement('svg', {
                className: 'w-5 h-5',
                fill: 'none',
                stroke: 'currentColor',
                viewBox: '0 0 24 24'
              },
                React.createElement('path', {
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  strokeWidth: 2,
                  d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                })
              ),
              'Reload Page'
            ),
            React.createElement('a', {
              href: 'https://github.com/andrewperkins/healthcarecompare/issues',
              target: '_blank',
              rel: 'noopener noreferrer',
              className: 'flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition'
            },
              React.createElement('svg', {
                className: 'w-5 h-5',
                fill: 'currentColor',
                viewBox: '0 0 24 24'
              },
                React.createElement('path', {
                  d: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z'
                })
              ),
              'Report Issue'
            )
          )
        )
      );
    }

    return this.props.children;
  }
}

/**
 * LLM Prompt for extracting plan data
 */
export const LLM_PROMPT = `Please analyze the attached Summary of Benefits and Coverage (SBC) document and extract the insurance plan information into the following JSON format. Pay close attention to copays, coinsurance percentages, and deductibles.

JSON Format Required:
{
  "name": "Plan Name (e.g., Bronze 6900, Silver 3000)",
  "medicalDeductible": {
    "person": 0,
    "family": 0
  },
  "rxDeductible": {
    "person": 0,
    "family": 0
  },
  "outOfPocketMax": {
    "person": 0,
    "family": 0
  },
  "copays": {
    "primaryCare": 0,
    "specialist": 0,
    "urgentCare": 0,
    "emergencyRoom": 0,
    "mentalHealth": 0,
    "diagnosticTest": 0,
    "diagnosticTestLab": 0,
    "imaging": 0.50,
    "rehabilitationOutpatient": 0,
    "habilitationOutpatient": 0
  },
  "coinsurance": {
    "hospitalFacility": 0.50,
    "outpatientSurgeryFacility": 0.50,
    "outpatientSurgeryASC": 0.25,
    "physicianSurgeon": 0.50,
    "childbirth": 0.50,
    "skilledNursing": 0.50,
    "homeHealthCare": 0.50,
    "dme": 0.50,
    "hospice": 0.50,
    "childrenGlasses": 0.50
  },
  "rxCopays": {
    "tier1": 15,
    "tier2": 30,
    "tier3": 0.30,
    "tier4": 0.50,
    "tier5": 0.50
  },
  "rxDeductibleWaived": [1, 2],
  "childrenDentalCheckup": 95,
  "childrenEyeExam": 0
}

Important Notes:
- For copays: Use dollar amounts (e.g., 45 for $45 copay)
- For coinsurance: Use decimal values (e.g., 0.50 for 50% coinsurance, 0.25 for 25%)
- For rxCopays: Tiers 1-2 are typically dollar amounts, Tiers 3-5 are typically coinsurance percentages (decimals)
- rxDeductibleWaived: Array of tier numbers where prescription deductible is waived
- If a service shows "No charge" or "$0", use 0
- If a service shows percentage coinsurance, convert to decimal (50% = 0.50)
- Look for separate prescription drug benefits section for rxCopays and rxDeductible
- Dental and vision benefits may be in separate sections

Please provide only the JSON object as your response, with accurate values extracted from the document.`;

/**
 * Copy text to clipboard with visual feedback
 */
export async function copyToClipboard(text, event) {
  try {
    await navigator.clipboard.writeText(text);
    // Show success feedback
    const button = event.target.closest('button');
    const originalText = button.innerHTML;
    button.innerHTML = '<i data-lucide="check" style="width: 18px; height: 18px;"></i> Copied!';
    button.className = button.className.replace('bg-blue-600 hover:bg-blue-700', 'bg-green-600');
    setTimeout(() => {
      button.innerHTML = originalText;
      button.className = button.className.replace('bg-green-600', 'bg-blue-600 hover:bg-blue-700');
      if (window.lucide) window.lucide.createIcons();
    }, 2000);
    if (window.lucide) window.lucide.createIcons();
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    alert('Failed to copy to clipboard. Please copy the text manually.');
    return false;
  }
}

/**
 * Format visit type name for display
 */
export function formatVisitType(visitType) {
  return visitType.replace(/([A-Z])/g, ' $1').trim();
}

/**
 * Scenario configurations
 */
export const SCENARIOS = [
  { key: 'bestCase', label: 'Best Case', icon: 'smile', color: 'green' },
  { key: 'mostLikely', label: 'Most Likely', icon: 'minus', color: 'blue' },
  { key: 'worstCase', label: 'Worst Case', icon: 'frown', color: 'red' }
];

/**
 * Dark Mode Toggle Button Component
 */
export const DarkModeToggle = ({ isDark, onToggle }) => {
  return React.createElement('button', {
    onClick: onToggle,
    className: 'text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors p-2 rounded-full border border-gray-300 dark:border-gray-600',
    title: isDark ? 'Switch to light mode' : 'Switch to dark mode',
    'aria-label': isDark ? 'Switch to light mode' : 'Switch to dark mode'
  },
    React.createElement(Icon, {
      name: isDark ? 'sun' : 'moon',
      size: 24
    })
  );
};
