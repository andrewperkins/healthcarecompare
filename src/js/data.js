/**
 * Data Management Functions
 * Functions for managing people, plans, medications, and scenarios
 */

/**
 * Default person template
 */
export const defaultPerson = {
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
};

/**
 * Default plan template
 */
export const defaultPlan = {
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
};

/**
 * Default cost settings for services
 * These represent typical costs for services that use coinsurance
 */
export const defaultCostSettings = {
  emergencyRoom: 1500,
  diagnosticTest: 300,
  imaging: 200,
  rehabilitationOutpatient: 150,
  habilitationOutpatient: 150,
  hospitalFacility: 5000,
  outpatientSurgeryFacility: 3000,
  outpatientSurgeryASC: 2000,
  physicianSurgeon: 1000,
  childbirth: 10000,
  skilledNursing: 500,
  homeHealthCare: 200,
  dme: 500,
  hospice: 300,
  childrenGlasses: 150
};

/**
 * Create a new cost settings object with default values
 * @returns {Object} New cost settings object
 */
export function createDefaultCostSettings() {
  return { ...defaultCostSettings };
}

/**
 * Create a new person with default values
 * @param {number} id - Person ID
 * @param {string} name - Person name
 * @returns {Object} New person object
 */
export function createNewPerson(id, name = null) {
  return {
    id,
    name: name || `Person ${id}`,
    ...defaultPerson
  };
}

/**
 * Create a new plan with default values
 * @param {number} id - Plan ID
 * @param {string} name - Plan name
 * @returns {Object} New plan object
 */
export function createNewPlan(id, name = null) {
  return {
    id,
    name: name || `Plan ${id}`,
    ...defaultPlan
  };
}

/**
 * Create scenario variations for a person
 * @param {Object} person - Base person object
 * @returns {Object} Object with bestCase, mostLikely, worstCase scenarios
 */
export function createPersonScenarios(person) {
  return {
    bestCase: {
      ...person,
      name: person.name.replace(' (Best Case)', '') + ' (Best Case)',
      visits: {
        primaryCare: Math.max(0, Math.floor(person.visits.primaryCare * 0.5)),
        specialist: Math.max(0, Math.floor(person.visits.specialist * 0.3)),
        urgentCare: Math.max(0, Math.floor(person.visits.urgentCare * 0.2)),
        emergencyRoom: 0,
        mentalHealth: Math.max(0, Math.floor(person.visits.mentalHealth * 0.7)),
        diagnosticTest: Math.max(0, Math.floor(person.visits.diagnosticTest * 0.5)),
        imaging: Math.max(0, Math.floor(person.visits.imaging * 0.3)),
        rehabilitationOutpatient: Math.max(0, Math.floor(person.visits.rehabilitationOutpatient * 0.5)),
        habilitationOutpatient: Math.max(0, Math.floor(person.visits.habilitationOutpatient * 0.5))
      }
    },
    mostLikely: { ...person },
    worstCase: {
      ...person,
      name: person.name.replace(' (Worst Case)', '') + ' (Worst Case)',
      visits: {
        primaryCare: person.visits.primaryCare + 2,
        specialist: person.visits.specialist + 3,
        urgentCare: person.visits.urgentCare + 1,
        emergencyRoom: person.visits.emergencyRoom + 1,
        mentalHealth: person.visits.mentalHealth + 2,
        diagnosticTest: person.visits.diagnosticTest + 2,
        imaging: person.visits.imaging + 1,
        rehabilitationOutpatient: person.visits.rehabilitationOutpatient + 4,
        habilitationOutpatient: person.visits.habilitationOutpatient + 2
      }
    }
  };
}

/**
 * Create scenarios for all people
 * @param {Array} people - Array of people
 * @returns {Object} Object with bestCase, mostLikely, worstCase arrays
 */
export function createScenarios(people) {
  const scenarios = {
    bestCase: [],
    mostLikely: [],
    worstCase: []
  };

  people.forEach(person => {
    const personScenarios = createPersonScenarios(person);
    scenarios.bestCase.push(personScenarios.bestCase);
    scenarios.mostLikely.push(personScenarios.mostLikely);
    scenarios.worstCase.push(personScenarios.worstCase);
  });

  return scenarios;
}

/**
 * Import person/people from JSON
 * @param {Object|Array} importedData - Imported JSON data
 * @param {Array} currentPeople - Current people array
 * @returns {Array} Array of valid people to add
 */
export function importPeople(importedData, currentPeople) {
  const peopleToImport = Array.isArray(importedData) ? importedData : [importedData];
  const validPeople = [];
  
  for (const person of peopleToImport) {
    if (person.name && person.visits && person.medications !== undefined) {
      const newId = Math.max(...currentPeople.map(p => p.id), 0) + validPeople.length + 1;
      validPeople.push({
        id: newId,
        name: person.name,
        medications: person.medications || [],
        visits: {
          ...defaultPerson.visits,
          ...person.visits
        }
      });
    }
  }

  return validPeople;
}

/**
 * Import plan from JSON
 * @param {Object} jsonData - Imported plan JSON
 * @param {number} premium - Monthly premium
 * @param {number} newId - ID for the new plan
 * @returns {Object} Imported plan object
 */
export function importPlanFromJSON(jsonData, premium, newId) {
  const requiredFields = ['name', 'medicalDeductible', 'rxDeductible', 'outOfPocketMax', 'copays', 'coinsurance', 'rxCopays'];
  const missingFields = requiredFields.filter(field => !jsonData.hasOwnProperty(field));
  
  if (missingFields.length > 0) {
    throw new Error('Missing required fields: ' + missingFields.join(', '));
  }

  return {
    id: newId,
    premium: parseFloat(premium),
    rxDeductibleWaived: jsonData.rxDeductibleWaived || [],
    childrenDentalCheckup: jsonData.childrenDentalCheckup || 0,
    childrenEyeExam: jsonData.childrenEyeExam || 0,
    ...jsonData
  };
}

/**
 * Import plan/plans from JSON
 * @param {Object|Array} importedData - Imported JSON data
 * @param {Array} currentPlans - Current plans array
 * @returns {Array} Array of valid plans to add
 */
export function importPlans(importedData, currentPlans) {
  const plansToImport = Array.isArray(importedData) ? importedData : [importedData];
  const validPlans = [];
  
  for (const plan of plansToImport) {
    const requiredFields = ['name', 'medicalDeductible', 'rxDeductible', 'outOfPocketMax', 'copays', 'coinsurance', 'rxCopays'];
    const hasRequiredFields = requiredFields.every(field => plan.hasOwnProperty(field));
    
    if (hasRequiredFields) {
      const newId = Math.max(...currentPlans.map(p => p.id), 0) + validPlans.length + 1;
      validPlans.push({
        id: newId,
        premium: parseFloat(plan.premium) || 0,
        rxDeductibleWaived: plan.rxDeductibleWaived || [],
        childrenDentalCheckup: plan.childrenDentalCheckup || 0,
        childrenEyeExam: plan.childrenEyeExam || 0,
        name: plan.name,
        medicalDeductible: plan.medicalDeductible,
        rxDeductible: plan.rxDeductible,
        outOfPocketMax: plan.outOfPocketMax,
        copays: {
          ...defaultPlan.copays,
          ...plan.copays
        },
        coinsurance: {
          ...defaultPlan.coinsurance,
          ...plan.coinsurance
        },
        rxCopays: {
          ...defaultPlan.rxCopays,
          ...plan.rxCopays
        }
      });
    }
  }

  return validPlans;
}
