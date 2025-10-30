/**
 * Cost Calculation Functions
 * All healthcare plan cost calculations and breakdowns
 */



/**
 * Calculate total annual cost for a plan
 * @param {Object} plan - The insurance plan
 * @param {Array} people - Array of people with visits and medications
 * @param {Object} costSettings - Settings for typical costs of services
 * @returns {Object} Breakdown of costs (premium, visits, medications, total, deductible, coinsurance)
 */
export function calculatePlanCost(plan, people, costSettings = null) {
  const costs = costSettings || {
    emergencyRoom: 1500,
    diagnosticTest: 300,
    imaging: 200,
    rehabilitationOutpatient: 150,
    habilitationOutpatient: 150,
  };

  const annualPremium = plan.premium * 12;

  const planDeductible = people.length > 1 ? plan.medicalDeductible.family : plan.medicalDeductible.person;
  const planMOOP = people.length > 1 ? plan.outOfPocketMax.family : plan.outOfPocketMax.person;

  let totalEstimatedExemptCopays = 0;
  let totalDeductibleApplicableCharges = 0;
  let coinsuranceRate = 0; // Assuming a single rate for simplicity, may need adjustment

  people.forEach(person => {
    // Estimate exempt copays (services not subject to deductible)
    totalEstimatedExemptCopays += (person.visits.primaryCare * plan.copays.primaryCare);
    totalEstimatedExemptCopays += (person.visits.specialist * plan.copays.specialist);
    totalEstimatedExemptCopays += (person.visits.urgentCare * plan.copays.urgentCare);
    totalEstimatedExemptCopays += (person.visits.mentalHealth * plan.copays.mentalHealth);

    // Sum up charges for services that are subject to the deductible
    const deductibleServices = [
      { type: 'emergencyRoom', visits: person.visits.emergencyRoom, cost: costs.emergencyRoom },
      { type: 'diagnosticTest', visits: person.visits.diagnosticTest, cost: costs.diagnosticTest },
      { type: 'imaging', visits: person.visits.imaging, cost: costs.imaging },
      { type: 'rehabilitationOutpatient', visits: person.visits.rehabilitationOutpatient, cost: costs.rehabilitationOutpatient },
      { type: 'habilitationOutpatient', visits: person.visits.habilitationOutpatient, cost: costs.habilitationOutpatient }
    ];

    deductibleServices.forEach(service => {
      if (service.visits > 0) {
        totalDeductibleApplicableCharges += service.visits * service.cost;
        // This is a simplification. Coinsurance can vary by service.
        // Using the first one found for now.
        if (plan.copays[service.type] > 0 && plan.copays[service.type] < 1) {
            coinsuranceRate = plan.copays[service.type];
        }
      }
    });

    // Prescription costs need to be factored in here as well, assuming they apply to deductible/MOOP
     person.medications.forEach(med => {
      const refills = med.refillsPerYear || 12;
      const customCost = parseFloat(med.customCost) || null;
      if (customCost) {
        totalDeductibleApplicableCharges += customCost * refills;
      } else {
        // Simplified logic for tiered drugs
        const tier = med.tier;
        const rxCopay = plan.rxCopays['tier' + tier];
        if (rxCopay > 1) { // It's a copay
            totalEstimatedExemptCopays += rxCopay * refills;
        } else { // It's coinsurance
            // Assume an average cost for drugs with coinsurance
            const estimatedDrugCost = 100; 
            totalDeductibleApplicableCharges += estimatedDrugCost * refills;
            if(coinsuranceRate === 0) coinsuranceRate = rxCopay;
        }
      }
    });
  });

  // Step A: Calculate Cost from Deductible-Applicable Charges
  const chargesAfterDeductible = Math.max(0, totalDeductibleApplicableCharges - planDeductible);
  const coinsurancePayment = chargesAfterDeductible * coinsuranceRate;
  const amountPaidToDeductible = Math.min(totalDeductibleApplicableCharges, planDeductible);
  const deductibleBasedCost = amountPaidToDeductible + coinsurancePayment;

  // Step B: Calculate Total OOP (Before the MOOP Ceiling)
  const calculatedOOP = deductibleBasedCost + totalEstimatedExemptCopays;

  // Step C: Apply the MOOP Ceiling
  const totalEstimatedOOP = Math.min(calculatedOOP, planMOOP);

  const totalAnnualCost = annualPremium + totalEstimatedOOP;

  return {
    premium: annualPremium,
    visits: totalEstimatedOOP, // This is a simplification, combining all OOP costs
    medications: 0, // Included in 'visits' now
    deductiblePaid: amountPaidToDeductible,
    coinsurancePaid: coinsurancePayment,
    total: totalAnnualCost
  };
}

/**
 * Get detailed cost breakdown with per-person calculations
 * @param {Object} plan - The insurance plan
 * @param {Array} people - Array of people with visits and medications
 * @param {Object} costSettings - Settings for typical costs of services
 * @returns {Object} Detailed breakdown of all costs
 */
/**
 * Get detailed cost breakdown with per-person calculations
 * @param {Object} plan - The insurance plan
 * @param {Array} people - Array of people with visits and medications
 * @param {Object} costSettings - Settings for typical costs of services
 * @returns {Object} Detailed breakdown of all costs
 */
export function getDetailedCostBreakdown(plan, people, costSettings = null) {
  const costs = costSettings || {
    emergencyRoom: 1500,
    diagnosticTest: 300,
    imaging: 200,
    rehabilitationOutpatient: 150,
    habilitationOutpatient: 150,
  };

  const annualPremium = plan.premium * 12;

  const planDeductible = people.length > 1 ? plan.medicalDeductible.family : plan.medicalDeductible.person;
  const planMOOP = people.length > 1 ? plan.outOfPocketMax.family : plan.outOfPocketMax.person;

  let totalEstimatedExemptCopays = 0;
  let totalDeductibleApplicableCharges = 0;
  let coinsuranceRate = 0; // Simplified

  const personBreakdowns = [];

  people.forEach(person => {
    const personBreakdown = {
      personName: person.name,
      exemptCopays: [],
      deductibleApplicableCharges: [],
      totalExemptCopays: 0,
      totalDeductibleApplicableCharges: 0,
    };

    // 1. Calculate Exempt Copays for the person
    const exemptServices = {
        primaryCare: { visits: person.visits.primaryCare, copay: plan.copays.primaryCare },
        specialist: { visits: person.visits.specialist, copay: plan.copays.specialist },
        urgentCare: { visits: person.visits.urgentCare, copay: plan.copays.urgentCare },
        mentalHealth: { visits: person.visits.mentalHealth, copay: plan.copays.mentalHealth },
    };

    Object.entries(exemptServices).forEach(([type, data]) => {
        if (data.visits > 0) {
            const cost = data.visits * data.copay;
            personBreakdown.exemptCopays.push({
                type: type.replace(/([A-Z])/g, ' $1').trim(),
                calculation: `${data.visits} × $${data.copay.toFixed(2)}`,
                cost: cost,
            });
            personBreakdown.totalExemptCopays += cost;
        }
    });
    
    person.medications.forEach(med => {
        const refills = med.refillsPerYear || 12;
        const customCost = parseFloat(med.customCost) || null;
        if (!customCost) {
            const tier = med.tier;
            const rxCopay = plan.rxCopays['tier' + tier];
            if (rxCopay > 1) { // It's a copay
                const cost = rxCopay * refills;
                personBreakdown.exemptCopays.push({
                    type: `${med.name || `Tier ${tier} Rx`}`,
                    calculation: `${refills} × $${rxCopay.toFixed(2)}`,
                    cost: cost,
                });
                personBreakdown.totalExemptCopays += cost;
            }
        }
    });

    // 2. Calculate Deductible Applicable Charges for the person
    const deductibleServices = [
      { type: 'emergencyRoom', visits: person.visits.emergencyRoom, cost: costs.emergencyRoom, planRate: plan.copays.emergencyRoom },
      { type: 'diagnosticTest', visits: person.visits.diagnosticTest, cost: costs.diagnosticTest, planRate: plan.copays.diagnosticTest },
      { type: 'imaging', visits: person.visits.imaging, cost: costs.imaging, planRate: plan.copays.imaging },
      { type: 'rehabilitationOutpatient', visits: person.visits.rehabilitationOutpatient, cost: costs.rehabilitationOutpatient, planRate: plan.copays.rehabilitationOutpatient },
      { type: 'habilitationOutpatient', visits: person.visits.habilitationOutpatient, cost: costs.habilitationOutpatient, planRate: plan.copays.habilitationOutpatient },
    ];

    deductibleServices.forEach(service => {
        if (service.visits > 0) {
            const charge = service.visits * service.cost;
            personBreakdown.deductibleApplicableCharges.push({
                type: service.type.replace(/([A-Z])/g, ' $1').trim(),
                calculation: `${service.visits} × $${service.cost.toFixed(2)}`,
                charge: charge,
            });
            personBreakdown.totalDeductibleApplicableCharges += charge;
            if (service.planRate > 0 && service.planRate < 1) {
                coinsuranceRate = service.planRate; // Simplified: last one wins
            }
        }
    });

    person.medications.forEach(med => {
        const refills = med.refillsPerYear || 12;
        const customCost = parseFloat(med.customCost) || null;
        if (customCost) {
            const charge = customCost * refills;
            personBreakdown.deductibleApplicableCharges.push({
                type: `${med.name || `Tier ${med.tier} Rx`}`,
                calculation: `${refills} × $${customCost.toFixed(2)}`,
                charge: charge,
            });
            personBreakdown.totalDeductibleApplicableCharges += charge;
        } else {
            const tier = med.tier;
            const rxCopay = plan.rxCopays['tier' + tier];
            if (rxCopay <= 1 && rxCopay > 0) { // It's coinsurance
                const estimatedDrugCost = 100;
                const charge = estimatedDrugCost * refills;
                personBreakdown.deductibleApplicableCharges.push({
                    type: `${med.name || `Tier ${tier} Rx`}`,
                    calculation: `${refills} × ~$${estimatedDrugCost}`,
                    charge: charge,
                });
                personBreakdown.totalDeductibleApplicableCharges += charge;
                if (coinsuranceRate === 0) coinsuranceRate = rxCopay;
            }
        }
    });
    
    // Add the person's breakdown to the list
    personBreakdowns.push(personBreakdown);

    // Add person's totals to the grand totals
    totalEstimatedExemptCopays += personBreakdown.totalExemptCopays;
    totalDeductibleApplicableCharges += personBreakdown.totalDeductibleApplicableCharges;
  });


  // Step A
  const chargesAfterDeductible = Math.max(0, totalDeductibleApplicableCharges - planDeductible);
  const coinsurancePayment = chargesAfterDeductible * coinsuranceRate;
  const amountPaidToDeductible = Math.min(totalDeductibleApplicableCharges, planDeductible);
  const deductibleBasedCost = amountPaidToDeductible + coinsurancePayment;

  // Step B
  const calculatedOOP = deductibleBasedCost + totalEstimatedExemptCopays;

  // Step C
  const totalEstimatedOOP = Math.min(calculatedOOP, planMOOP);
  const grandTotal = annualPremium + totalEstimatedOOP;

  return {
    planName: plan.name,
    premiumBreakdown: {
        annualPremium: annualPremium,
        monthlyPremium: plan.premium,
        monthsPerYear: 12,
    },
    personBreakdowns, // New detailed per-person breakdown
    deductibleBreakdown: {
      medicalDeductible: planDeductible,
      medicalDeductiblePaid: amountPaidToDeductible,
      totalDeductibleApplicableCharges,
      deductibleBasedCost,
    },
    coinsuranceBreakdown: {
      totalCoinsurancePaid: coinsurancePayment,
      coinsuranceRate,
    },
    oopBreakdown: {
        totalEstimatedExemptCopays,
        calculatedOOP,
        planMOOP,
        totalEstimatedOOP
    },
    grandTotal
  };
}
