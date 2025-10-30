/**
 * Cost Calculation Functions
 * All healthcare plan cost calculations and breakdowns
 */

/**
 * Calculate total annual cost for a plan
 * @param {Object} plan - The insurance plan
 * @param {Array} people - Array of people with visits and medications
 * @returns {Object} Breakdown of costs (premium, visits, medications, total)
 */
export function calculatePlanCost(plan, people) {
  // Annual premium
  const premiumCost = plan.premium * 12;

  // Medical visits - sum across all people
  let visitCosts = 0;
  people.forEach(person => {
    visitCosts += 
      (person.visits.primaryCare * plan.copays.primaryCare) +
      (person.visits.specialist * plan.copays.specialist) +
      (person.visits.urgentCare * plan.copays.urgentCare) +
      (person.visits.emergencyRoom * plan.copays.emergencyRoom) +
      (person.visits.mentalHealth * plan.copays.mentalHealth) +
      (person.visits.diagnosticTest * plan.copays.diagnosticTest) +
      (person.visits.imaging * 200 * plan.copays.imaging) + // Assume $200 imaging cost
      (person.visits.rehabilitationOutpatient * plan.copays.rehabilitationOutpatient) +
      (person.visits.habilitationOutpatient * plan.copays.habilitationOutpatient);
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
    total: premiumCost + visitCosts + rxCost
  };
}

/**
 * Get detailed cost breakdown with per-person calculations
 * @param {Object} plan - The insurance plan
 * @param {Array} people - Array of people with visits and medications
 * @returns {Object} Detailed breakdown of all costs
 */
export function getDetailedCostBreakdown(plan, people) {
  // Premium calculation
  const premiumBreakdown = {
    monthlyPremium: plan.premium,
    monthsPerYear: 12,
    annualPremium: plan.premium * 12
  };

  // Visit costs breakdown
  const visitBreakdown = [];
  let totalVisitCosts = 0;

  people.forEach(person => {
    const personVisitCosts = {};
    let personTotal = 0;

    Object.keys(person.visits).forEach(visitType => {
      const visits = person.visits[visitType];
      let costPerVisit = plan.copays[visitType];
      
      // Special case for imaging which uses coinsurance
      if (visitType === 'imaging') {
        costPerVisit = 200 * plan.copays.imaging; // $200 * coinsurance percentage
      }
      
      const totalCost = visits * costPerVisit;
      personVisitCosts[visitType] = {
        visits,
        costPerVisit,
        totalCost,
        calculation: visitType === 'imaging' 
          ? `${visits} visits × $200 × ${(plan.copays.imaging * 100).toFixed(1)}% = $${totalCost.toFixed(2)}`
          : `${visits} visits × $${costPerVisit.toFixed(2)} = $${totalCost.toFixed(2)}`
      };
      personTotal += totalCost;
    });

    visitBreakdown.push({
      personName: person.name,
      visitCosts: personVisitCosts,
      personTotal
    });
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
    totalVisitCosts,
    totalRxCosts,
    grandTotal: premiumBreakdown.annualPremium + totalVisitCosts + totalRxCosts
  };
}
