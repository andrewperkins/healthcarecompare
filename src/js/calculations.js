/**
 * Cost Calculation Functions
 * All healthcare plan cost calculations and breakdowns
 */

/**
 * Determine if a service uses coinsurance (returns percentage) or copay (returns fixed amount)
 * @param {Object} plan - The insurance plan
 * @param {string} visitType - Type of visit
 * @returns {Object} { isCoinsurance: boolean, rate: number }
 */
function getServiceCostType(plan, visitType) {
  const copay = plan.copays[visitType];
  
  // If copay is between 0 and 1, it's a coinsurance percentage
  // Otherwise it's a fixed copay amount
  if (copay > 0 && copay < 1) {
    return { isCoinsurance: true, rate: copay };
  }
  return { isCoinsurance: false, rate: copay };
}

/**
 * Calculate cost for a service that may use deductible and coinsurance
 * @param {number} totalCost - Total cost of the service
 * @param {number} deductibleRemaining - How much deductible is left
 * @param {number} coinsuranceRate - Coinsurance percentage (0-1)
 * @param {boolean} isCoinsurance - Whether this service uses coinsurance
 * @returns {Object} { patientPays, deductibleUsed, coinsuranceAmount }
 */
function calculateServiceCost(totalCost, deductibleRemaining, coinsuranceRate, isCoinsurance) {
  if (!isCoinsurance) {
    // Fixed copay - no deductible applies
    return {
      patientPays: coinsuranceRate, // In this case it's actually the copay amount
      deductibleUsed: 0,
      coinsuranceAmount: 0
    };
  }
  
  // Service uses coinsurance - deductible applies first
  let deductibleUsed = 0;
  let coinsuranceAmount = 0;
  
  if (deductibleRemaining > 0) {
    deductibleUsed = Math.min(totalCost, deductibleRemaining);
    const afterDeductible = totalCost - deductibleUsed;
    coinsuranceAmount = afterDeductible * coinsuranceRate;
  } else {
    coinsuranceAmount = totalCost * coinsuranceRate;
  }
  
  return {
    patientPays: deductibleUsed + coinsuranceAmount,
    deductibleUsed,
    coinsuranceAmount
  };
}

/**
 * Calculate total annual cost for a plan
 * @param {Object} plan - The insurance plan
 * @param {Array} people - Array of people with visits and medications
 * @param {Object} costSettings - Settings for typical costs of services
 * @returns {Object} Breakdown of costs (premium, visits, medications, total, deductible, coinsurance)
 */
export function calculatePlanCost(plan, people, costSettings = null) {
  // Use default costs if not provided
  const costs = costSettings || {
    emergencyRoom: 1500,
    diagnosticTest: 300,
    imaging: 200,
    rehabilitationOutpatient: 150,
    habilitationOutpatient: 150
  };

  // Annual premium
  const premiumCost = plan.premium * 12;

  // Use family deductible if more than one person
  const medicalDeductible = people.length > 1 
    ? plan.medicalDeductible.family 
    : plan.medicalDeductible.person;
  const rxDeductible = people.length > 1 
    ? plan.rxDeductible.family 
    : plan.rxDeductible.person;

  let medicalDeductibleRemaining = medicalDeductible;
  let rxDeductibleRemaining = rxDeductible;
  let totalDeductiblePaid = 0;
  let totalCoinsurancePaid = 0;

  // Medical visits - sum across all people
  let visitCosts = 0;
  
  people.forEach(person => {
    // Services that typically use fixed copays
    visitCosts += 
      (person.visits.primaryCare * plan.copays.primaryCare) +
      (person.visits.specialist * plan.copays.specialist) +
      (person.visits.urgentCare * plan.copays.urgentCare) +
      (person.visits.mentalHealth * plan.copays.mentalHealth);

    // Services that may use coinsurance - need to check and apply deductible
    const coinsuranceServices = [
      { type: 'emergencyRoom', visits: person.visits.emergencyRoom, cost: costs.emergencyRoom },
      { type: 'diagnosticTest', visits: person.visits.diagnosticTest, cost: costs.diagnosticTest },
      { type: 'imaging', visits: person.visits.imaging, cost: costs.imaging },
      { type: 'rehabilitationOutpatient', visits: person.visits.rehabilitationOutpatient, cost: costs.rehabilitationOutpatient },
      { type: 'habilitationOutpatient', visits: person.visits.habilitationOutpatient, cost: costs.habilitationOutpatient }
    ];

    coinsuranceServices.forEach(service => {
      if (service.visits > 0) {
        const totalServiceCost = service.visits * service.cost;
        const costType = getServiceCostType(plan, service.type);
        const result = calculateServiceCost(
          totalServiceCost,
          medicalDeductibleRemaining,
          costType.rate,
          costType.isCoinsurance
        );
        
        visitCosts += result.patientPays;
        totalDeductiblePaid += result.deductibleUsed;
        totalCoinsurancePaid += result.coinsuranceAmount;
        medicalDeductibleRemaining -= result.deductibleUsed;
      }
    });
  });

  // Medications
  let rxCost = 0;
  people.forEach(person => {
    person.medications.forEach(med => {
      const tier = med.tier;
      const refills = med.refillsPerYear || 12;
      const customCost = parseFloat(med.customCost) || null;
      
      if (customCost) {
        // Use custom cost provided by user
        rxCost += customCost * refills;
      } else if (tier <= 2 && plan.rxDeductibleWaived.includes(tier)) {
        // Deductible waived
        rxCost += plan.rxCopays['tier' + tier] * refills;
      } else if (tier <= 2) {
        rxCost += plan.rxCopays['tier' + tier] * refills;
      } else {
        // Tier 3+ uses coinsurance
        rxCost += 50 * plan.rxCopays['tier' + tier] * refills; // Assuming $50 avg cost
      }
    });
  });

  return {
    premium: premiumCost,
    visits: visitCosts,
    medications: rxCost,
    deductiblePaid: totalDeductiblePaid,
    coinsurancePaid: totalCoinsurancePaid,
    total: premiumCost + visitCosts + rxCost
  };
}

/**
 * Get detailed cost breakdown with per-person calculations
 * @param {Object} plan - The insurance plan
 * @param {Array} people - Array of people with visits and medications
 * @param {Object} costSettings - Settings for typical costs of services
 * @returns {Object} Detailed breakdown of all costs
 */
export function getDetailedCostBreakdown(plan, people, costSettings = null) {
  // Use default costs if not provided
  const costs = costSettings || {
    emergencyRoom: 1500,
    diagnosticTest: 300,
    imaging: 200,
    rehabilitationOutpatient: 150,
    habilitationOutpatient: 150
  };

  // Premium calculation
  const premiumBreakdown = {
    monthlyPremium: plan.premium,
    monthsPerYear: 12,
    annualPremium: plan.premium * 12
  };

  // Use family deductible if more than one person
  const medicalDeductible = people.length > 1 
    ? plan.medicalDeductible.family 
    : plan.medicalDeductible.person;
  const rxDeductible = people.length > 1 
    ? plan.rxDeductible.family 
    : plan.rxDeductible.person;

  let medicalDeductibleRemaining = medicalDeductible;
  let rxDeductibleRemaining = rxDeductible;
  let totalMedicalDeductiblePaid = 0;
  let totalRxDeductiblePaid = 0;
  let totalCoinsurancePaid = 0;

  // Visit costs breakdown
  const visitBreakdown = [];
  let totalVisitCosts = 0;

  people.forEach(person => {
    const personVisitCosts = {};
    let personTotal = 0;

    Object.keys(person.visits).forEach(visitType => {
      const visits = person.visits[visitType];
      if (visits === 0) return;

      const costType = getServiceCostType(plan, visitType);
      let totalCost = 0;
      let calculation = '';
      let deductibleApplied = 0;
      let coinsuranceApplied = 0;
      
      // Determine service cost and whether it uses coinsurance
      const serviceCosts = {
        emergencyRoom: costs.emergencyRoom,
        diagnosticTest: costs.diagnosticTest,
        imaging: costs.imaging,
        rehabilitationOutpatient: costs.rehabilitationOutpatient,
        habilitationOutpatient: costs.habilitationOutpatient
      };
      
      if (costType.isCoinsurance && serviceCosts[visitType]) {
        // Service uses coinsurance - apply deductible first
        const totalServiceCost = visits * serviceCosts[visitType];
        const result = calculateServiceCost(
          totalServiceCost,
          medicalDeductibleRemaining,
          costType.rate,
          true
        );
        
        totalCost = result.patientPays;
        deductibleApplied = result.deductibleUsed;
        coinsuranceApplied = result.coinsuranceAmount;
        totalMedicalDeductiblePaid += deductibleApplied;
        totalCoinsurancePaid += coinsuranceApplied;
        medicalDeductibleRemaining -= deductibleApplied;
        
        if (deductibleApplied > 0) {
          const afterDeductible = totalServiceCost - deductibleApplied;
          calculation = `${visits} visits × $${serviceCosts[visitType]} = $${totalServiceCost.toFixed(2)} ($${deductibleApplied.toFixed(2)} to deductible, then $${afterDeductible.toFixed(2)} × ${(costType.rate * 100).toFixed(1)}% coinsurance = $${coinsuranceApplied.toFixed(2)})`;
        } else {
          calculation = `${visits} visits × $${serviceCosts[visitType]} × ${(costType.rate * 100).toFixed(1)}% coinsurance = $${totalCost.toFixed(2)}`;
        }
      } else {
        // Fixed copay
        totalCost = visits * costType.rate;
        calculation = `${visits} visits × $${costType.rate.toFixed(2)} copay = $${totalCost.toFixed(2)}`;
      }
      
      personVisitCosts[visitType] = {
        visits,
        costPerVisit: costType.isCoinsurance ? serviceCosts[visitType] : costType.rate,
        totalCost,
        deductibleApplied,
        coinsuranceApplied,
        calculation
      };
      personTotal += totalCost;
    });

    if (Object.keys(personVisitCosts).length > 0) {
      visitBreakdown.push({
        personName: person.name,
        visitCosts: personVisitCosts,
        personTotal
      });
    }
    totalVisitCosts += personTotal;
  });

  // Medication costs breakdown
  const medicationBreakdown = [];
  let totalRxCosts = 0;

  people.forEach(person => {
    const personMedCosts = [];
    let personMedTotal = 0;

    person.medications.forEach(med => {
      const tier = med.tier;
      const refills = med.refillsPerYear || 12;
      const customCost = parseFloat(med.customCost) || null;
      let costPerFill;
      let deductibleWaived = false;
      let calculation;
      
      if (customCost) {
        // Use custom cost provided by user
        costPerFill = customCost;
        calculation = `${refills} refills × $${costPerFill.toFixed(2)} (custom cost) = $${(costPerFill * refills).toFixed(2)}`;
      } else if (tier <= 2) {
        costPerFill = plan.rxCopays['tier' + tier];
        deductibleWaived = plan.rxDeductibleWaived.includes(tier);
        calculation = `${refills} refills × $${costPerFill.toFixed(2)} copay = $${(costPerFill * refills).toFixed(2)}`;
      } else {
        // Tier 3+ uses coinsurance on assumed $50 cost
        costPerFill = 50 * plan.rxCopays['tier' + tier];
        calculation = `${refills} refills × ($50 × ${(plan.rxCopays['tier' + tier] * 100).toFixed(1)}%) = $${(costPerFill * refills).toFixed(2)}`;
      }
      
      const totalCost = costPerFill * refills;
      
      personMedCosts.push({
        medicationName: med.name || `Tier ${tier} Medication`,
        tier,
        refills,
        costPerFill,
        totalCost,
        deductibleWaived,
        customCost: customCost,
        calculation
      });
      personMedTotal += totalCost;
    });

    if (personMedCosts.length > 0) {
      medicationBreakdown.push({
        personName: person.name,
        medications: personMedCosts,
        personTotal: personMedTotal
      });
    }
    totalRxCosts += personMedTotal;
  });

  return {
    planName: plan.name,
    premiumBreakdown,
    visitBreakdown,
    medicationBreakdown,
    deductibleBreakdown: {
      medicalDeductible,
      medicalDeductiblePaid: totalMedicalDeductiblePaid,
      rxDeductible,
      rxDeductiblePaid: totalRxDeductiblePaid,
      totalDeductiblePaid: totalMedicalDeductiblePaid + totalRxDeductiblePaid
    },
    coinsuranceBreakdown: {
      totalCoinsurancePaid
    },
    totalVisitCosts,
    totalRxCosts,
    grandTotal: premiumBreakdown.annualPremium + totalVisitCosts + totalRxCosts
  };
}
