import React, { useState, useEffect } from 'react';
import {
  calculatePlanCost as calculatePlanCostImpl,
  getDetailedCostBreakdown as getDetailedCostBreakdownImpl,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearAllData,
  exportData,
  createNewPerson,
  createNewPlan,
  createScenarios,
  importPeople,
  importPlans,
  importPlanFromJSON,
  defaultPerson,
  defaultCostSettings,
  Icon,
  ErrorBoundary,
  LLM_PROMPT,
  copyToClipboard,
  formatVisitType,
  SCENARIOS,
  useDarkMode,
  DarkModeToggle
} from './healthcareCompare';

// Currency formatter
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en', {
    currency: 'USD',
    style: 'currency',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
};

const HealthInsuranceCalculator = () => {
  // Dark mode hook
  const [isDark, toggleDark] = useDarkMode();
  
  // Default data
  const defaultPeople = [
    { 
      id: 1, 
      name: 'Person 1', 
      medications: [],
      visits: {
        primaryCare: 0,
        specialist: 0,
        urgentCare: 0,
        emergencyRoom: 0,
        mentalHealth: 0,
        diagnosticTest: 0,
        imaging: 0,
        rehabilitationOutpatient: 0,
        habilitationOutpatient: 0
      }
    }
  ];

  const [people, setPeople] = useState(() => {
    try {
      const stored = localStorage.getItem('healthcarecompare-people');
      return stored ? JSON.parse(stored) : defaultPeople;
    } catch (error) {
      console.warn('Failed to load people from localStorage:', error);
      return defaultPeople;
    }
  });

  // Default empty plans
  const defaultPlans = [];

  const [plans, setPlans] = useState(() => {
    try {
      const stored = localStorage.getItem('healthcarecompare-plans');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load plans from localStorage:', error);
      return [];
    }
  });

  const [costSettings, setCostSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('healthcarecompare-costsettings');
      return stored ? JSON.parse(stored) : defaultCostSettings;
    } catch (error) {
      console.warn('Failed to load cost settings from localStorage:', error);
      return defaultCostSettings;
    }
  });

  const [editingPlan, setEditingPlan] = useState(null);
  const [importPremium, setImportPremium] = useState('');
  const [importError, setImportError] = useState('');
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(() => {
    // Check if disclaimer has been accepted (cookie expires in 7 days)
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };
    return getCookie('disclaimerAccepted') !== 'true';
  });
  
  // Scenarios state
  const [activeScenario, setActiveScenario] = useState('mostLikely');
  const [scenariosEnabled, setScenariosEnabled] = useState(false);
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [selectedPlanForCalculation, setSelectedPlanForCalculation] = useState(null);
  const [scenarios, setScenarios] = useState(() => {
    try {
      const stored = localStorage.getItem('healthcarecompare-scenarios');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load scenarios from localStorage:', error);
    }
    
    // Default scenarios - get people from localStorage or use default
    let currentPeople;
    try {
      const storedPeople = localStorage.getItem('healthcarecompare-people');
      currentPeople = storedPeople ? JSON.parse(storedPeople) : defaultPeople;
    } catch (error) {
      currentPeople = defaultPeople;
    }
    
    return createScenarios(currentPeople);
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    saveToLocalStorage('healthcarecompare-people', people);
    
    // Update "Most Likely" scenario to match current people
    setScenarios(prev => ({
      ...prev,
      mostLikely: [...people]
    }));
  }, [people]);

  useEffect(() => {
    saveToLocalStorage('healthcarecompare-plans', plans);
  }, [plans]);

  useEffect(() => {
    saveToLocalStorage('healthcarecompare-scenarios', scenarios);
  }, [scenarios]);

  useEffect(() => {
    saveToLocalStorage('healthcarecompare-costsettings', costSettings);
  }, [costSettings]);

  const showLLMPrompt = () => {
    setShowPromptModal(true);
  };

  const copyPromptToClipboard = async (event) => {
    await copyToClipboard(LLM_PROMPT, event);
  };

  const acceptDisclaimer = () => {
    // Set cookie to expire in 7 days
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    document.cookie = `disclaimerAccepted=true; expires=${expires.toUTCString()}; path=/`;
    setShowDisclaimerModal(false);
  };

  const handleJsonImport = () => {
    if (!importPremium || parseFloat(importPremium) <= 0) {
      setImportError('Please enter a valid monthly premium before importing.');
      return;
    }

    if (!pastedJson.trim()) {
      setImportError('Please paste JSON data before importing.');
      return;
    }

    try {
      const jsonData = JSON.parse(pastedJson);
      const newId = Math.max(...plans.map(p => p.id), 0) + 1;
      const importedPlan = importPlanFromJSON(jsonData, importPremium, newId);

      setPlans([...plans, importedPlan]);
      setImportPremium('');
      setPastedJson('');
      setImportError('');
      
      // Show success message
      alert('Successfully imported plan: ' + jsonData.name);
      // close modal
      setShowPromptModal(false);
    } catch (error) {
      setImportError('Invalid JSON: ' + error.message);
    }
  };

  // Wrapper functions using imported modules
  const exportAllPlans = () => {
    exportData(plans, 'insurance-plans.json');
  };

  const exportPlan = (plan) => {
    const planToExport = { ...plan };
    delete planToExport.id;
    exportData(planToExport, plan.name.toLowerCase().replace(/\s+/g, '-') + '-plan.json');
  };

  const exportAllPeople = () => {
    exportData(people, 'family-members.json');
  };

  const exportPerson = (person) => {
    const personToExport = { ...person };
    delete personToExport.id;
    exportData(personToExport, person.name.toLowerCase().replace(/\s+/g, '-') + '-profile.json');
  };

  const importPeopleData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        const validPeople = importPeople(importedData, people);

        if (validPeople.length > 0) {
          setPeople([...people, ...validPeople]);
          alert('Successfully imported ' + validPeople.length + ' family member(s)');
        } else {
          alert('No valid family member data found in the file');
        }
        
        event.target.value = '';
      } catch (error) {
        alert('Invalid JSON file: ' + error.message);
      }
    };
    
    reader.readAsText(file);
  };

  const importPlansData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        const validPlans = importPlans(importedData, plans);

        if (validPlans.length > 0) {
          setPlans([...plans, ...validPlans]);
          alert('Successfully imported ' + validPlans.length + ' plan(s)');
        } else {
          alert('No valid plan data found in the file');
        }
        
        event.target.value = '';
      } catch (error) {
        alert('Invalid JSON file: ' + error.message);
      }
    };
    
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (clearAllData()) {
      // Reset to default state
      setPeople([createNewPerson(1, 'Person 1')]);
      setPlans([]);
      setScenarios(createScenarios([createNewPerson(1, 'Person 1')]));
      alert('All data has been cleared successfully.');
    }
  };

  const addPerson = () => {
    const newId = Math.max(...people.map(p => p.id), 0) + 1;
    const newPerson = createNewPerson(newId);
    
    setPeople([...people, newPerson]);
    
    // Add to all scenarios using imported function
    const personScenarios = createScenarios([newPerson]);
    setScenarios(prev => ({
      bestCase: [...prev.bestCase, personScenarios.bestCase[0]],
      mostLikely: [...prev.mostLikely, personScenarios.mostLikely[0]],
      worstCase: [...prev.worstCase, personScenarios.worstCase[0]]
    }));
  };

  const removePerson = (id) => {
    if (people.length > 1) {
      setPeople(people.filter(p => p.id !== id));
      
      // Remove from all scenarios
      setScenarios(prev => ({
        bestCase: prev.bestCase.filter(p => p.id !== id),
        mostLikely: prev.mostLikely.filter(p => p.id !== id),
        worstCase: prev.worstCase.filter(p => p.id !== id)
      }));
    }
  };

  const updatePersonName = (id, name) => {
    setPeople(people.map(p => p.id === id ? { ...p, name } : p));
    // Note: mostLikely scenario is automatically synced via useEffect
  };

  const updateScenarioPersonName = (id, name) => {
    setScenarios(prev => ({
      ...prev,
      [activeScenario]: prev[activeScenario].map(p => p.id === id ? { ...p, name } : p)
    }));
  };

  const updatePersonVisits = (id, visitType, value) => {
    setPeople(people.map(p => {
      if (p.id === id) {
        return {
          ...p,
          visits: {
            ...p.visits,
            [visitType]: parseInt(value) || 0
          }
        };
      }
      return p;
    }));
  };

  const updateScenarioPersonVisits = (id, visitType, value) => {
    setScenarios(prev => ({
      ...prev,
      [activeScenario]: prev[activeScenario].map(p => {
        if (p.id === id) {
          return {
            ...p,
            visits: {
              ...p.visits,
              [visitType]: parseInt(value) || 0
            }
          };
        }
        return p;
      })
    }));
  };

  const addMedication = (personId) => {
    setPeople(people.map(p => {
      if (p.id === personId) {
        const newMedId = Math.max(...p.medications.map(m => m.id), 0) + 1;
        return {
          ...p,
          medications: [...p.medications, { id: newMedId, name: '', tier: 1, refillsPerYear: 12, customCost: '' }]
        };
      }
      return p;
    }));
  };

  const addScenarioMedication = (personId) => {
    setScenarios(prev => ({
      ...prev,
      [activeScenario]: prev[activeScenario].map(p => {
        if (p.id === personId) {
          const newMedId = Math.max(...p.medications.map(m => m.id), 0) + 1;
          return {
            ...p,
            medications: [...p.medications, { id: newMedId, name: '', tier: 1, refillsPerYear: 12, customCost: '' }]
          };
        }
        return p;
      })
    }));
  };

  const removeMedication = (personId, medId) => {
    setPeople(people.map(p => {
      if (p.id === personId) {
        return { ...p, medications: p.medications.filter(m => m.id !== medId) };
      }
      return p;
    }));
  };

  const removeScenarioMedication = (personId, medId) => {
    setScenarios(prev => ({
      ...prev,
      [activeScenario]: prev[activeScenario].map(p => {
        if (p.id === personId) {
          return { ...p, medications: p.medications.filter(m => m.id !== medId) };
        }
        return p;
      })
    }));
  };

  const updateMedication = (personId, medId, field, value) => {
    setPeople(people.map(p => {
      if (p.id === personId) {
        return {
          ...p,
          medications: p.medications.map(m => 
            m.id === medId ? { ...m, [field]: value } : m
          )
        };
      }
      return p;
    }));
  };

  const updateScenarioMedication = (personId, medId, field, value) => {
    setScenarios(prev => ({
      ...prev,
      [activeScenario]: prev[activeScenario].map(p => {
        if (p.id === personId) {
          return {
            ...p,
            medications: p.medications.map(m => 
              m.id === medId ? { ...m, [field]: value } : m
            )
          };
        }
        return p;
      })
    }));
  };

  const toggleScenarios = () => {
    if (!scenariosEnabled) {
      // Enabling scenarios - copy from most likely to create best and worst case
      const mostLikelyData = scenarios.mostLikely;
      setScenarios(prev => ({
        ...prev,
        bestCase: mostLikelyData.map(person => ({
          ...person,
          name: person.name.replace(' (Best Case)', '') + ' (Best Case)',
          visits: { ...person.visits }
        })),
        worstCase: mostLikelyData.map(person => ({
          ...person,
          name: person.name.replace(' (Worst Case)', '') + ' (Worst Case)',
          visits: { ...person.visits }
        }))
      }));
    }
    setScenariosEnabled(!scenariosEnabled);
  };

  const showPlanCalculation = (plan) => {
    setSelectedPlanForCalculation(plan);
    setShowCalculationModal(true);
  };

  const addPlan = () => {
    const newId = Math.max(...plans.map(p => p.id), 0) + 1;
    setPlans([...plans, {
      id: newId,
      name: 'Plan ' + newId,
      premium: 0,
      medicalDeductible: { person: 0, family: 0 },
      rxDeductible: { person: 0, family: 0 },
      outOfPocketMax: { person: 0, family: 0 },
      copays: {
        primaryCare: 0,
        specialist: 0,
        urgentCare: 0,
        emergencyRoom: 0,
        mentalHealth: 0,
        diagnosticTest: 0,
        diagnosticTestLab: 0,
        imaging: 0,
        rehabilitationOutpatient: 0,
        habilitationOutpatient: 0
      },
      coinsurance: {
        hospitalFacility: 0,
        outpatientSurgeryFacility: 0,
        outpatientSurgeryASC: 0,
        physicianSurgeon: 0,
        childbirth: 0,
        skilledNursing: 0,
        homeHealthCare: 0,
        dme: 0,
        hospice: 0,
        childrenGlasses: 0
      },
      rxCopays: {
        tier1: 0,
        tier2: 0,
        tier3: 0,
        tier4: 0,
        tier5: 0
      },
      rxDeductibleWaived: [],
      childrenDentalCheckup: 0,
      childrenEyeExam: 0
    }]);
  };

  const removePlan = (id) => {
    setPlans(plans.filter(p => p.id !== id));
  };

  const updatePlan = (planId, field, value) => {
    setPlans(plans.map(p => p.id === planId ? { ...p, [field]: value } : p));
  };

  const updatePlanNested = (planId, category, field, value) => {
    setPlans(plans.map(p => {
      if (p.id === planId) {
        return {
          ...p,
          [category]: {
            ...p[category],
            [field]: value
          }
        };
      }
      return p;
    }));
  };

  const updateCostSetting = (field, value) => {
    setCostSettings({
      ...costSettings,
      [field]: parseFloat(value) || 0
    });
  };

  const resetCostSettings = () => {
    setCostSettings(defaultCostSettings);
  };

  const calculatePlanCost = (plan, scenarioKey = null) => {
    const scenarioPeople = scenarioKey ? scenarios[scenarioKey] : (scenariosEnabled ? scenarios[activeScenario] : people);
    
    // Use imported calculation function with cost settings
    return calculatePlanCostImpl(plan, scenarioPeople, costSettings);
  };

  const getDetailedCostBreakdown = (plan, scenarioKey = null) => {
    const scenarioPeople = scenarioKey ? scenarios[scenarioKey] : (scenariosEnabled ? scenarios[activeScenario] : people);
    
    // Use imported calculation function with cost settings
    const breakdown = getDetailedCostBreakdownImpl(plan, scenarioPeople, costSettings);
    
    // Add scenario name for UI
    return {
      ...breakdown,
      scenarioName: scenarioKey || (scenariosEnabled ? activeScenario : 'current')
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-3 sm:p-6 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          {/* Top row: GitHub icon, Dark mode toggle, and Clear All button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/andrewperkins/healthcarecompare"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black dark:text-white bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors p-2 rounded-full border border-gray-300 dark:border-gray-600"
                title="View on GitHub"
              >
                <svg height="24" aria-hidden="true" viewBox="0 0 24 24" version="1.1" width="24" className="fill-current">
                  <path d="M12 1C5.923 1 1 5.923 1 12c0 4.867 3.149 8.979 7.521 10.436.55.096.756-.233.756-.522 0-.262-.013-1.128-.013-2.049-2.764.509-3.479-.674-3.699-1.292-.124-.317-.66-1.293-1.127-1.554-.385-.207-.936-.715-.014-.729.866-.014 1.485.797 1.691 1.128.99 1.663 2.571 1.196 3.204.907.096-.715.385-1.196.701-1.471-2.448-.275-5.005-1.224-5.005-5.432 0-1.196.426-2.186 1.128-2.956-.111-.275-.496-1.402.11-2.915 0 0 .921-.288 3.024 1.128a10.193 10.193 0 0 1 2.75-.371c.936 0 1.871.123 2.75.371 2.104-1.43 3.025-1.128 3.025-1.128.605 1.513.221 2.64.111 2.915.701.77 1.127 1.747 1.127 2.956 0 4.222-2.571 5.157-5.019 5.432.399.344.743 1.004.743 2.035 0 1.471-.014 2.654-.014 3.025 0 .289.206.632.756.522C19.851 20.979 23 16.854 23 12c0-6.077-4.922-11-11-11Z"></path>
                </svg>
              </a>
              <button
                onClick={toggleDark}
                className="text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors p-2 rounded-full border border-gray-300 dark:border-gray-600"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-1 sm:gap-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition text-xs sm:text-sm whitespace-nowrap"
                title="Configure typical costs for services"
              >
                <Icon name="settings" size={16} />
                <span>Cost Settings</span>
              </button>
              <button
                onClick={handleClearAllData}
                className="flex items-center gap-1 sm:gap-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition text-xs sm:text-sm whitespace-nowrap"
                title="Clear all data and start over"
              >
                <Icon name="trash-2" size={16} />
                <span>Clear All Data</span>
              </button>
            </div>
          </div>
          
          {/* Second row: Centered title */}
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 text-center">
            Health Care Compare
          </h1>
        </div>

        {/* People Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-6 mb-4 sm:mb-6 transition-colors">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Icon name="users" className="text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">Family Members</h2>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportAllPeople}
                  className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-1 sm:gap-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition text-xs sm:text-sm whitespace-nowrap"
                >
                  <Icon name="download" size={16} />
                  <span>Export All</span>
                </button>
                <div className="relative flex-grow sm:flex-grow-0">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importPeopleData}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="import-people"
                  />
                  <label
                    htmlFor="import-people"
                    className="flex items-center justify-center gap-1 sm:gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm cursor-pointer whitespace-nowrap h-full"
                  >
                    <Icon name="upload" size={16} />
                    <span>Import</span>
                  </label>
                </div>
                <button
                  onClick={addPerson}
                  className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-1 sm:gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition text-xs sm:text-sm whitespace-nowrap"
                >
                  <Icon name="plus" size={16} />
                  <span>Add Person</span>
                </button>
              </div>
            </div>
            
            {/* Scenario Selector - only show when scenarios are enabled */}
            {scenariosEnabled && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 transition-colors">
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Scenario:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'bestCase', label: 'Best Case', icon: 'smile', color: 'green' },
                    { key: 'mostLikely', label: 'Most Likely', icon: 'minus', color: 'blue' },
                    { key: 'worstCase', label: 'Worst Case', icon: 'frown', color: 'red' }
                  ].map(scenario => (
                    <button
                      key={scenario.key}
                      onClick={() => setActiveScenario(scenario.key)}
                      className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition ${
                        activeScenario === scenario.key
                          ? `bg-${scenario.color}-600 text-white`
                          : `text-${scenario.color}-600 hover:bg-${scenario.color}-50`
                      }`}
                    >
                      <Icon name={scenario.icon} size={14} />
                      {scenario.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {(scenariosEnabled ? scenarios[activeScenario] : people).map(person => (
              <div key={person.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4 bg-white dark:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <input
                    type="text"
                    value={person.name}
                    onChange={(e) => (!scenariosEnabled || activeScenario === 'mostLikely') ? updatePersonName(person.id, e.target.value) : updateScenarioPersonName(person.id, e.target.value)}
                    className="text-base sm:text-lg font-medium border-b border-transparent hover:border-gray-300 dark:hover:border-gray-500 focus:border-indigo-600 dark:focus:border-indigo-400 focus:outline-none px-2 py-1 flex-1 bg-transparent text-gray-800 dark:text-gray-100"
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => exportPerson(person)}
                      className="text-green-600 hover:bg-green-50 p-2 rounded transition"
                      title="Export this person"
                    >
                      <Icon name="download" size={16} />
                    </button>
                    {people.length > 1 && (
                      <button
                        onClick={() => removePerson(person.id)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded transition"
                        title="Remove this person"
                      >
                        <Icon name="trash-2" size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Care Visits per Person */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="activity" size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Annual Care Visits</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 ml-0 sm:ml-6">
                    {Object.keys(person.visits).map(visitType => (
                      <div key={visitType}>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 capitalize">
                          {visitType.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={person.visits[visitType]}
                          onChange={(e) => (!scenariosEnabled || activeScenario === 'mostLikely') ? updatePersonVisits(person.id, visitType, e.target.value) : updateScenarioPersonVisits(person.id, visitType, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Medications */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon name="pill-half" size={16} className="text-green-600 dark:text-green-400" />
                      <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Medications</span>
                    </div>
                    <button
                      onClick={() => (!scenariosEnabled || activeScenario === 'mostLikely') ? addMedication(person.id) : addScenarioMedication(person.id)}
                      className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition"
                    >
                      <Icon name="plus" size={14} />
                      Add
                    </button>
                  </div>

                  {person.medications.length > 0 && (
                    <div className="space-y-2 ml-0 sm:ml-6">
                      {person.medications.map(med => (
                        <div key={med.id} className="flex flex-col gap-2 bg-gray-50 dark:bg-gray-600 p-2 rounded transition-colors">
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              placeholder="Medication name"
                              value={med.name}
                              onChange={(e) => (!scenariosEnabled || activeScenario === 'mostLikely') ? updateMedication(person.id, med.id, 'name', e.target.value) : updateScenarioMedication(person.id, med.id, 'name', e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm min-w-0 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                            />
                            <div className="flex gap-2">
                              <select
                                value={med.tier}
                                onChange={(e) => (!scenariosEnabled || activeScenario === 'mostLikely') ? updateMedication(person.id, med.id, 'tier', parseInt(e.target.value)) : updateScenarioMedication(person.id, med.id, 'tier', parseInt(e.target.value))}
                                className="px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm flex-1 sm:flex-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                              >
                                <option value={1}>Tier 1</option>
                                <option value={2}>Tier 2</option>
                                <option value={3}>Tier 3</option>
                                <option value={4}>Tier 4</option>
                                <option value={5}>Tier 5</option>
                              </select>
                              <input
                                type="number"
                                placeholder="Refills/yr"
                                value={med.refillsPerYear}
                                onChange={(e) => (!scenariosEnabled || activeScenario === 'mostLikely') ? updateMedication(person.id, med.id, 'refillsPerYear', parseInt(e.target.value) || 0) : updateScenarioMedication(person.id, med.id, 'refillsPerYear', parseInt(e.target.value) || 0)}
                                className="w-20 sm:w-20 px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                              />
                              <button
                                onClick={() => (!scenariosEnabled || activeScenario === 'mostLikely') ? removeMedication(person.id, med.id) : removeScenarioMedication(person.id, med.id)}
                                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded transition flex-shrink-0"
                              >
                                <Icon name="trash-2" size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">Custom Cost per Refill ($):</label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Optional - leave blank to use plan tier"
                              value={med.customCost || ''}
                              onChange={(e) => (!scenariosEnabled || activeScenario === 'mostLikely') ? updateMedication(person.id, med.id, 'customCost', e.target.value) : updateScenarioMedication(person.id, med.id, 'customCost', e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plans Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-6 transition-colors">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">Plan Comparison</h2>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={toggleScenarios}
                  className={`flex-grow sm:flex-grow-0 flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 rounded-lg transition text-xs sm:text-sm whitespace-nowrap ${
                    scenariosEnabled 
                      ? 'bg-orange-600 text-white hover:bg-orange-700' 
                      : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                  }`}
                >
                  <Icon name="layers" size={16} />
                  <span>{scenariosEnabled ? 'Disable' : 'Enable'} Scenarios</span>
                </button>
                <button
                  onClick={exportAllPlans}
                  className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-1 sm:gap-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition text-xs sm:text-sm whitespace-nowrap"
                >
                  <Icon name="download" size={16} />
                  <span>Export All</span>
                </button>
                <div className="relative flex-grow sm:flex-grow-0">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importPlansData}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="import-plans"
                  />
                  <label
                    htmlFor="import-plans"
                    className="flex items-center justify-center gap-1 sm:gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm cursor-pointer whitespace-nowrap h-full"
                  >
                    <Icon name="upload" size={16} />
                    <span>Import</span>
                  </label>
                </div>
                <button
                  onClick={showLLMPrompt}
                  className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-1 sm:gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition text-xs sm:text-sm whitespace-nowrap"
                >
                  <Icon name="brain" size={16} />
                  <span>Add using LLM</span>
                </button>
                <button
                  onClick={addPlan}
                  className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-1 sm:gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition text-xs sm:text-sm whitespace-nowrap"
                >
                  <Icon name="plus" size={16} />
                  <span>Add Plan</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {plans.map(plan => {
              const costs = calculatePlanCost(plan);
              return (
                <div key={plan.id} className="border-2 border-indigo-200 dark:border-indigo-700 rounded-lg p-3 sm:p-4 hover:shadow-xl transition bg-white dark:bg-gray-700">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <input
                      type="text"
                      value={plan.name}
                      onChange={(e) => updatePlan(plan.id, 'name', e.target.value)}
                      className="text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400 border-b border-transparent hover:border-gray-300 dark:hover:border-gray-500 focus:border-indigo-600 dark:focus:border-indigo-400 focus:outline-none px-2 py-1 flex-1 min-w-0 bg-transparent"
                    />
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      <button
                        onClick={() => showPlanCalculation(plan)}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded transition"
                        title="View detailed cost calculations"
                      >
                        <Icon name="info" size={16} />
                      </button>
                      <button
                        onClick={() => exportPlan(plan)}
                        className="text-purple-600 hover:bg-purple-50 p-2 rounded transition"
                        title="Export this plan"
                      >
                        <Icon name="download" size={16} />
                      </button>
                      <button
                        onClick={() => removePlan(plan.id)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded transition"
                        title="Remove this plan"
                      >
                        <Icon name="trash-2" size={18} />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setEditingPlan(editingPlan === plan.id ? null : plan.id)}
                    className="w-full text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-3 text-left"
                  >
                    {editingPlan === plan.id ? '▼ Hide Details' : '▶ Edit Plan Details'}
                  </button>

                  {editingPlan === plan.id && (
                    <div className="space-y-2 mb-4 bg-gray-50 dark:bg-gray-600 p-2 sm:p-3 rounded max-h-96 overflow-y-auto text-sm transition-colors">
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Basic Info</div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Monthly Premium</label>
                        <input
                          type="number"
                          step="0.01"
                          value={plan.premium}
                          onChange={(e) => updatePlan(plan.id, 'premium', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400">Medical Deductible (Person)</label>
                          <input
                            type="number"
                            value={plan.medicalDeductible.person}
                            onChange={(e) => updatePlanNested(plan.id, 'medicalDeductible', 'person', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400">Medical Deductible (Family)</label>
                          <input
                            type="number"
                            value={plan.medicalDeductible.family}
                            onChange={(e) => updatePlanNested(plan.id, 'medicalDeductible', 'family', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400">Rx Deductible (Person)</label>
                          <input
                            type="number"
                            value={plan.rxDeductible.person}
                            onChange={(e) => updatePlanNested(plan.id, 'rxDeductible', 'person', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400">Rx Deductible (Family)</label>
                          <input
                            type="number"
                            value={plan.rxDeductible.family}
                            onChange={(e) => updatePlanNested(plan.id, 'rxDeductible', 'family', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400">OOP Max (Person)</label>
                          <input
                            type="number"
                            value={plan.outOfPocketMax.person}
                            onChange={(e) => updatePlanNested(plan.id, 'outOfPocketMax', 'person', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400">OOP Max (Family)</label>
                          <input
                            type="number"
                            value={plan.outOfPocketMax.family}
                            onChange={(e) => updatePlanNested(plan.id, 'outOfPocketMax', 'family', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                          />
                        </div>
                      </div>
                      
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-3">Copays</div>
                      {Object.keys(plan.copays).map(key => (
                        <div key={key}>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={plan.copays[key]}
                            onChange={(e) => updatePlanNested(plan.id, 'copays', key, parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                          />
                        </div>
                      ))}

                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-3">Rx Copays/Coinsurance</div>
                      {Object.keys(plan.rxCopays).map(key => (
                        <div key={key}>
                          <label className="block text-xs text-gray-600 uppercase">{key}</label>
                          <input
                            type="number"
                            step="0.01"
                            value={plan.rxCopays[key]}
                            onChange={(e) => updatePlanNested(plan.id, 'rxCopays', key, parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      ))}

                      <div className="text-xs font-semibold text-gray-700 mt-3">Coinsurance Services</div>
                      {Object.keys(plan.coinsurance).map(key => (
                        <div key={key}>
                          <label className="block text-xs text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={plan.coinsurance[key]}
                            onChange={(e) => updatePlanNested(plan.id, 'coinsurance', key, parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {scenariosEnabled ? (
                    // Show all three scenarios when enabled
                    <div className="space-y-3">
                      {[
                        { key: 'bestCase', label: 'Best Case', color: 'green', icon: 'smile' },
                        { key: 'mostLikely', label: 'Most Likely', color: 'blue', icon: 'minus' },
                        { key: 'worstCase', label: 'Worst Case', color: 'red', icon: 'frown' }
                      ].map(scenario => {
                        const scenarioCosts = calculatePlanCost(plan, scenario.key);
                        return (
                          <div key={scenario.key} className={`bg-${scenario.color}-50 border border-${scenario.color}-200 p-3 rounded-lg`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Icon name={scenario.icon} size={16} className={`text-${scenario.color}-600`} />
                                <span className={`font-semibold text-${scenario.color}-800`}>{scenario.label}</span>
                              </div>
                              <span className={`font-bold text-lg text-${scenario.color}-700`}>
                                {formatCurrency(scenarioCosts.total)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Premium: {formatCurrency(scenarioCosts.premium)}</span>
                              <span>Visits: {formatCurrency(scenarioCosts.visits)}</span>
                              <span>Rx: {formatCurrency(scenarioCosts.medications)}</span>
                            </div>
                          </div>
                        );
                      })}
                      <div className="bg-gray-100 p-2 rounded text-center text-sm text-gray-600">
                        Range: {formatCurrency(calculatePlanCost(plan, 'worstCase').total - calculatePlanCost(plan, 'bestCase').total)}
                      </div>
                    </div>
                  ) : (
                    // Show single cost when scenarios disabled
                    <div className="space-y-3 bg-indigo-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Annual Premium</span>
                        <span className="font-semibold dark:text-gray-200">{formatCurrency(costs.premium)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Out-of-Pocket Costs</span>
                        <span className="font-semibold dark:text-gray-200">{formatCurrency(costs.visits)}</span>
                      </div>
                      <div className="border-t-2 border-indigo-300 dark:border-indigo-600 pt-2 flex justify-between">
                        <span className="font-bold text-gray-800 dark:text-gray-100">Total Yearly Cost</span>
                        <span className="font-bold text-2xl text-indigo-600 dark:text-indigo-400">{formatCurrency(costs.total)}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 text-xs text-gray-500 space-y-1">
                    <div>Med Deductible: ${plan.medicalDeductible.person.toLocaleString()} / ${plan.medicalDeductible.family.toLocaleString()}</div>
                    <div>Rx Deductible: ${plan.rxDeductible.person.toLocaleString()} / ${plan.rxDeductible.family.toLocaleString()}</div>
                    <div>OOP Max: ${plan.outOfPocketMax.person.toLocaleString()} / ${plan.outOfPocketMax.family.toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cost Calculation Modal */}
      {showCalculationModal && selectedPlanForCalculation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-2 sm:p-4 z-50" onClick={() => setShowCalculationModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden transition-colors" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200 dark:border-gray-600">
              <h2 className="text-base sm:text-xl font-semibold text-gray-800 dark:text-gray-100">Cost Calculation - {selectedPlanForCalculation.name}</h2>
              <button
                onClick={() => setShowCalculationModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition flex-shrink-0 ml-2"
              >
                <Icon name="x" size={24} />
              </button>
            </div>
            
            <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-80px)] sm:max-h-[calc(90vh-140px)]">
              {scenariosEnabled ? (
                // Show all scenarios when enabled
                <div className="space-y-4 sm:space-y-8">
                  {[
                    { key: 'bestCase', label: 'Best Case', color: 'green' },
                    { key: 'mostLikely', label: 'Most Likely', color: 'blue' },
                    { key: 'worstCase', label: 'Worst Case', color: 'red' }
                  ].map(scenario => {
                    const breakdown = getDetailedCostBreakdown(selectedPlanForCalculation, scenario.key);
                    return (
                      <div key={scenario.key} className={`border-2 border-${scenario.color}-200 rounded-lg p-3 sm:p-4`}>
                        <h3 className={`text-base sm:text-lg font-semibold text-${scenario.color}-800 mb-3 sm:mb-4`}>{scenario.label} Scenario</h3>
                        
                        {/* Premium Section */}
                        <div className="mb-4 sm:mb-6">
                          <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Annual Premium</h4>
                          <div className="bg-gray-50 p-2 sm:p-3 rounded">
                            <p className="text-xs sm:text-sm text-gray-600">
                              {formatCurrency(breakdown.premiumBreakdown.monthlyPremium)}/month × {breakdown.premiumBreakdown.monthsPerYear} months = 
                              <span className="font-semibold"> {formatCurrency(breakdown.premiumBreakdown.annualPremium)}</span>
                            </p>
                          </div>
                        </div>

                        {/* Medical Visits Section */}
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-800 mb-2">Medical Visits</h4>
                          {breakdown.visitBreakdown.map((person, idx) => (
                            <div key={idx} className="mb-4 bg-gray-50 p-3 rounded">
                              <h5 className="font-medium text-gray-700 mb-2">{person.personName}</h5>
                              <div className="space-y-1 text-sm">
                                {Object.entries(person.visitCosts).map(([visitType, cost]) => 
                                  cost.visits > 0 && (
                                    <div key={visitType} className="flex justify-between">
                                      <span className="capitalize">{visitType.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                      <span>{cost.calculation}</span>
                                    </div>
                                  )
                                )}
                                <div className="border-t pt-1 flex justify-between font-medium">
                                  <span>Person Total:</span>
                                  <span>{formatCurrency(person.personTotal)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="bg-blue-50 p-2 rounded">
                            <div className="flex justify-between font-semibold">
                              <span>Total Medical Visits:</span>
                              <span>{formatCurrency(breakdown.totalVisitCosts)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Medications Section */}
                        {breakdown.medicationBreakdown.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-semibold text-gray-800 mb-2">Medications</h4>
                            {breakdown.medicationBreakdown.map((person, idx) => (
                              <div key={idx} className="mb-4 bg-gray-50 p-3 rounded">
                                <h5 className="font-medium text-gray-700 mb-2">{person.personName}</h5>
                                <div className="space-y-1 text-sm">
                                  {person.medications.map((med, medIdx) => (
                                    <div key={medIdx} className="flex justify-between">
                                      <span>{med.medicationName} (Tier {med.tier}):</span>
                                      <span>{med.calculation}</span>
                                    </div>
                                  ))}
                                  <div className="border-t pt-1 flex justify-between font-medium">
                                    <span>Person Total:</span>
                                    <span>{formatCurrency(person.personTotal)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div className="bg-green-50 p-2 rounded">
                              <div className="flex justify-between font-semibold">
                                <span>Total Medications:</span>
                                <span>{formatCurrency(breakdown.totalRxCosts)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Grand Total */}
                        <div className={`bg-${scenario.color}-100 p-4 rounded-lg border-2 border-${scenario.color}-300`}>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Annual Premium:</span>
                              <span>{formatCurrency(breakdown.premiumBreakdown.annualPremium)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Medical Visits:</span>
                              <span>{formatCurrency(breakdown.totalVisitCosts)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Medications:</span>
                              <span>{formatCurrency(breakdown.totalRxCosts)}</span>
                            </div>
                            <div className="border-t-2 border-gray-400 pt-2 flex justify-between font-bold text-lg">
                              <span>Grand Total:</span>
                              <span>{formatCurrency(breakdown.grandTotal)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Show single scenario when disabled
                (() => {
                  const breakdown = getDetailedCostBreakdown(selectedPlanForCalculation);
                  return (
                    <div>
                      {/* Premium Section */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Annual Premium</h4>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {formatCurrency(breakdown.premiumBreakdown.monthlyPremium)}/month × {breakdown.premiumBreakdown.monthsPerYear} months = 
                            <span className="font-semibold"> {formatCurrency(breakdown.premiumBreakdown.annualPremium)}</span>
                          </p>
                        </div>
                      </div>

                      {/* OOP Calculation Section */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Out-of-Pocket Cost Calculation</h4>

                        {/* Per-Person Breakdown */}
                        <div className="mb-4 space-y-4">
                          <p className="text-sm text-gray-800 dark:text-gray-300 font-medium">Per-Person Cost Details</p>
                          {breakdown.personBreakdowns.map((person, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                              <h5 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">{person.personName}</h5>
                              
                              {/* Exempt Copays for Person */}
                              {person.exemptCopays.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Exempt Copays (Not subject to deductible)</p>
                                  <div className="pl-4 text-xs space-y-1 mt-1">
                                    {person.exemptCopays.map((item, i) => (
                                      <div key={i} className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-300 capitalize">{item.type}: {item.calculation}</span>
                                        <span className="font-medium">{formatCurrency(item.cost)}</span>
                                      </div>
                                    ))}
                                    <div className="flex justify-between font-semibold border-t border-gray-200 dark:border-gray-500 pt-1">
                                      <span className="text-gray-700 dark:text-gray-200">Total Exempt Copays</span>
                                      <span>{formatCurrency(person.totalExemptCopays)}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Deductible Applicable Charges for Person */}
                              {person.deductibleApplicableCharges.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Deductible Applicable Charges</p>
                                  <div className="pl-4 text-xs space-y-1 mt-1">
                                    {person.deductibleApplicableCharges.map((item, i) => (
                                      <div key={i} className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-300 capitalize">{item.type}: {item.calculation}</span>
                                        <span className="font-medium">{formatCurrency(item.charge)}</span>
                                      </div>
                                    ))}
                                    <div className="flex justify-between font-semibold border-t border-gray-200 dark:border-gray-500 pt-1">
                                      <span className="text-gray-700 dark:text-gray-200">Total Deductible Charges</span>
                                      <span>{formatCurrency(person.totalDeductibleApplicableCharges)}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded space-y-2">
                            <p className="text-sm text-gray-800 dark:text-gray-300 font-medium">Step A: Cost from Deductible-Applicable Charges (Family Total)</p>
                            <div className="flex justify-between text-sm pl-4">
                                <span className="text-gray-600 dark:text-gray-400">Total Deductible Applicable Charges:</span>
                                <span>{formatCurrency(breakdown.deductibleBreakdown.totalDeductibleApplicableCharges)}</span>
                            </div>
                            <div className="flex justify-between text-sm pl-4">
                                <span className="text-gray-600 dark:text-gray-400">Plan Deductible:</span>
                                <span>- {formatCurrency(breakdown.deductibleBreakdown.medicalDeductible)}</span>
                            </div>
                            <div className="flex justify-between text-sm pl-4 border-t border-gray-200 dark:border-gray-600 pt-1">
                                <span className="text-gray-600 dark:text-gray-400">Amount Paid to Deductible:</span>
                                <span>{formatCurrency(breakdown.deductibleBreakdown.medicalDeductiblePaid)}</span>
                            </div>
                             <div className="flex justify-between text-sm pl-4">
                                <span className="text-gray-600 dark:text-gray-400">Charges After Deductible × Coinsurance ({breakdown.coinsuranceBreakdown.coinsuranceRate * 100}%):</span>
                                <span>+ {formatCurrency(breakdown.coinsuranceBreakdown.totalCoinsurancePaid)}</span>
                            </div>
                            <div className="flex justify-between text-sm pl-4 font-semibold border-t border-gray-200 dark:border-gray-600 pt-1">
                                <span className="text-gray-800 dark:text-gray-200">Deductible-Based Cost:</span>
                                <span>{formatCurrency(breakdown.deductibleBreakdown.deductibleBasedCost)}</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded space-y-2 mt-2">
                            <p className="text-sm text-gray-800 dark:text-gray-300 font-medium">Step B: Total OOP (Before MOOP)</p>
                             <div className="flex justify-between text-sm pl-4">
                                <span className="text-gray-600 dark:text-gray-400">Deductible-Based Cost:</span>
                                <span>{formatCurrency(breakdown.deductibleBreakdown.deductibleBasedCost)}</span>
                            </div>
                            <div className="flex justify-between text-sm pl-4">
                                <span className="text-gray-600 dark:text-gray-400">Total Estimated Exempt Copays (Family Total):</span>
                                <span>+ {formatCurrency(breakdown.oopBreakdown.totalEstimatedExemptCopays)}</span>
                            </div>
                            <div className="flex justify-between text-sm pl-4 font-semibold border-t border-gray-200 dark:border-gray-600 pt-1">
                                <span className="text-gray-800 dark:text-gray-200">Calculated OOP:</span>
                                <span>{formatCurrency(breakdown.oopBreakdown.calculatedOOP)}</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded space-y-2 mt-2">
                            <p className="text-sm text-gray-800 dark:text-gray-300 font-medium">Step C: Apply MOOP Ceiling</p>
                             <div className="flex justify-between text-sm pl-4">
                                <span className="text-gray-600 dark:text-gray-400">Calculated OOP:</span>
                                <span>{formatCurrency(breakdown.oopBreakdown.calculatedOOP)}</span>
                            </div>
                            <div className="flex justify-between text-sm pl-4">
                                <span className="text-gray-600 dark:text-gray-400">Plan Max-Out-of-Pocket (MOOP):</span>
                                <span>{formatCurrency(breakdown.oopBreakdown.planMOOP)}</span>
                            </div>
                            <div className="flex justify-between text-sm pl-4 font-semibold border-t border-gray-200 dark:border-gray-600 pt-1">
                                <span className="text-gray-800 dark:text-gray-200">Total Estimated OOP (lesser of the two):</span>
                                <span className="text-green-600 dark:text-green-400">{formatCurrency(breakdown.oopBreakdown.totalEstimatedOOP)}</span>
                            </div>
                        </div>
                      </div>


                      {/* Grand Total */}
                      <div className="bg-indigo-100 dark:bg-indigo-900 p-4 rounded-lg border-2 border-indigo-300 dark:border-indigo-700">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="dark:text-gray-200">Annual Premium:</span>
                            <span className="dark:text-gray-200">{formatCurrency(breakdown.premiumBreakdown.annualPremium)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="dark:text-gray-200">Total Estimated Out-of-Pocket:</span>
                            <span className="dark:text-gray-200">{formatCurrency(breakdown.oopBreakdown.totalEstimatedOOP)}</span>
                          </div>
                          <div className="border-t-2 border-gray-400 dark:border-gray-500 pt-2 flex justify-between font-bold text-lg">
                            <span className="dark:text-gray-100">Grand Total:</span>
                            <span className="dark:text-gray-100">{formatCurrency(breakdown.grandTotal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
              
              {/* Calculation Notes */}
              <div className="mt-4 sm:mt-8 bg-yellow-50 dark:bg-yellow-800 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 text-sm sm:text-base">Calculation Notes & Assumptions:</h4>
                <ul className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• This calculation follows the formula provided, applying the plan's deductible and MOOP.</li>
                  <li>• <strong>Exempt Copays:</strong> Costs for services like primary care, specialist visits, etc., that are not subject to the deductible.</li>
                  <li>• <strong>Deductible Applicable Charges:</strong> Full cost of services like ER, imaging, and certain medications before insurance discounts.</li>
                  <li>• <strong>Coinsurance Rate:</strong> A single coinsurance rate is assumed for simplicity. The actual rate may vary by service.</li>
                  <li>• <strong>Medications:</strong> Medications with a flat copay are treated as 'exempt'. Medications with coinsurance or a custom cost are treated as 'deductible applicable'. An estimated cost of $100 is used for coinsurance-based drugs if no custom cost is provided.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cost Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-2 sm:p-4 z-50" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden transition-colors" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-600">
              <h2 className="text-lg sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">Cost Settings</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                <Icon name="x" size={24} />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Configure typical costs for healthcare services that use coinsurance. These values are used to calculate how much you'll pay after meeting your deductible.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Emergency Room Visit
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 mr-2">$</span>
                    <input
                      type="number"
                      value={costSettings.emergencyRoom}
                      onChange={(e) => updateCostSetting('emergencyRoom', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Diagnostic Test
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 mr-2">$</span>
                    <input
                      type="number"
                      value={costSettings.diagnosticTest}
                      onChange={(e) => updateCostSetting('diagnosticTest', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Imaging (X-ray, MRI, etc.)
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 mr-2">$</span>
                    <input
                      type="number"
                      value={costSettings.imaging}
                      onChange={(e) => updateCostSetting('imaging', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rehabilitation (Outpatient)
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 mr-2">$</span>
                    <input
                      type="number"
                      value={costSettings.rehabilitationOutpatient}
                      onChange={(e) => updateCostSetting('rehabilitationOutpatient', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Habilitation (Outpatient)
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 mr-2">$</span>
                    <input
                      type="number"
                      value={costSettings.habilitationOutpatient}
                      onChange={(e) => updateCostSetting('habilitationOutpatient', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <button
                  onClick={resetCostSettings}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                >
                  Reset to Defaults
                </button>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add using LLM Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-2 sm:p-4 z-50" onClick={() => setShowPromptModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden transition-colors" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200 dark:border-gray-600">
              <h2 className="text-base sm:text-xl font-semibold text-gray-800 dark:text-gray-100">Add Insurance Plan using LLM</h2>
              <button
                onClick={() => setShowPromptModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition flex-shrink-0 ml-2"
              >
                <Icon name="x" size={24} />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row h-[calc(95vh-130px)] sm:h-[calc(90vh-80px)]">
              {/* Left side - LLM Prompt */}
              <div className="flex-1 p-3 sm:p-6 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-600 overflow-y-auto">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 sm:mb-3">Step 1: Get LLM Prompt</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                  Copy this prompt and paste it into your favorite LLM (ChatGPT, Claude, etc.), then attach your Summary of Benefits and Coverage PDF:
                </p>
                <div className="relative mb-3 sm:mb-4">
                  <textarea
                    readOnly
                    value={`Please analyze the attached Summary of Benefits and Coverage (SBC) document and extract the insurance plan information into the following JSON format. Pay close attention to copays, coinsurance percentages, and deductibles.

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

Please provide only the JSON object as your response, with accurate values extracted from the document.`}
                    className="w-full h-48 sm:h-80 px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-xs bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 resize-none"
                  />
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={copyPromptToClipboard}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm"
                  >
                    <Icon name="copy" size={16} />
                    Copy Prompt to Clipboard
                  </button>
                </div>
              </div>

              {/* Right side - JSON Import */}
              <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 sm:mb-3">Step 2: Import Generated JSON</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                  After getting the JSON response from your LLM, paste it below along with the monthly premium:
                </p>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Monthly Premium ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Enter monthly premium"
                      value={importPremium}
                      onChange={(e) => setImportPremium(e.target.value)}
                      className="w-full px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Paste JSON Data from LLM</label>
                    <textarea
                      placeholder="Paste the JSON response from your LLM here..."
                      value={pastedJson}
                      onChange={(e) => setPastedJson(e.target.value)}
                      rows="8"
                      className="w-full px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 focus:border-transparent font-mono text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                  {importError && (
                    <div className="p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs sm:text-sm text-red-600 dark:text-red-400">
                      {importError}
                    </div>
                  )}
                  <div className="flex justify-center">
                    <button
                      onClick={handleJsonImport}
                      className="flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition text-xs sm:text-sm"
                    >
                      <Icon name="plus" size={16} />
                      Add Plan to Comparison
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex justify-end gap-2 p-3 sm:p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
              <button
                onClick={() => setShowPromptModal(false)}
                className="px-3 sm:px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition text-xs sm:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer Modal */}
      {showDisclaimerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 dark:bg-opacity-85 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 sm:p-6 md:p-8">
              <div className="flex items-center justify-center mb-4 sm:mb-6">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 sm:p-4 rounded-full">
                  <Icon name="alert-triangle" size={36} className="text-yellow-600 dark:text-yellow-500 sm:w-12 sm:h-12" />
                </div>
              </div>
              
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 text-center mb-3 sm:mb-4">
                Important Disclaimer
              </h2>
              
              <div className="space-y-3 sm:space-y-4 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                <p className="font-semibold text-center text-base sm:text-lg">
                  This tool is for informational and educational purposes only.
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <p>
                    <strong>Not Professional Advice:</strong> The information provided by this healthcare comparison tool does not constitute legal, financial, or medical advice. You should not rely on this tool as a substitute for professional advice from qualified professionals.
                  </p>
                  
                  <p>
                    <strong>No Warranty:</strong> This tool is provided "as is" without any warranty of accuracy, completeness, or fitness for a particular purpose. Healthcare costs and insurance benefits can vary significantly based on many factors not captured by this tool.
                  </p>
                  
                  <p>
                    <strong>Consult Professionals:</strong> Before making any healthcare or insurance decisions, please consult with qualified healthcare providers, insurance professionals, and financial advisors who can review your specific situation.
                  </p>
                  
                  <p>
                    <strong>Your Responsibility:</strong> You are solely responsible for verifying all information with your insurance provider and making informed decisions about your healthcare coverage.
                  </p>
                </div>
                
                <p className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 italic">
                  By clicking "I Understand" below, you acknowledge that you have read and understood this disclaimer.
                </p>
              </div>
              
              <div className="mt-4 sm:mt-6 flex justify-center">
                <button
                  onClick={acceptDisclaimer}
                  className="bg-indigo-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg hover:bg-indigo-700 transition text-base sm:text-lg font-semibold shadow-lg w-full sm:w-auto"
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthInsuranceCalculator;

