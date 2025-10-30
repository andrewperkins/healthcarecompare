import { formatCurrency } from './formatters.js';
import { formatVisitType } from './ui.js';

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
  const breakdown = getDetailedCostBreakdown(plan, people, costSettings);

  return {
    premium: breakdown.premiumBreakdown.annualPremium,
    visits: breakdown.finalFamilyOOP,
    medications: 0, // Included in 'visits'
    total: breakdown.grandTotal
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

  const annualPremium = (plan.premium || 0) * 12;

  // Determine which limits to use, ensuring they are numbers
  const isFamilyPlan = people.length > 1;
  const individualDeductibleLimit = plan.medicalDeductible?.person || 0;
  const familyDeductibleLimit = isFamilyPlan ? (plan.medicalDeductible?.family || individualDeductibleLimit) : individualDeductibleLimit;
  const individualMOOPLimit = plan.outOfPocketMax?.person || 0;
  const familyMOOPLimit = isFamilyPlan ? (plan.outOfPocketMax?.family || individualMOOPLimit) : individualMOOPLimit;

  let familyDeductiblePaid = 0;
  let familyOOPPaid = 0;
  let coinsuranceRate = 0; // Simplified

  const personBreakdowns = [];

  // First, gather all charges for each person
  people.forEach(person => {
    const personBreakdown = {
      personName: person.name,
      id: person.id,
      totalCharges: 0,
      deductiblePaid: 0,
      coinsurancePaid: 0,
      totalOOP: 0,
      note: null,
      calculations: {},
      chargeDetails: {
        exempt: [],
        deductible: []
      }
    };

    // 1. Gather Exempt Copays (services that don't count towards deductible)
    const exemptServices = {
        primaryCare: { visits: person.visits.primaryCare, copay: plan.copays?.primaryCare || 0 },
        specialist: { visits: person.visits.specialist, copay: plan.copays?.specialist || 0 },
        urgentCare: { visits: person.visits.urgentCare, copay: plan.copays?.urgentCare || 0 },
        mentalHealth: { visits: person.visits.mentalHealth, copay: plan.copays?.mentalHealth || 0 },
    };
    Object.entries(exemptServices).forEach(([type, data]) => {
        if (data.visits > 0) {
            const cost = data.visits * data.copay;
            personBreakdown.chargeDetails.exempt.push({
              name: formatVisitType(type),
              calculation: `${data.visits} visit(s) × ${formatCurrency(data.copay)}/visit`,
              cost: cost
            });
        }
    });
    person.medications.forEach(med => {
        const refills = med.refillsPerYear || 12;
        if (!med.customCost) {
            const rxCopay = plan.rxCopays ? (plan.rxCopays['tier' + med.tier] || 0) : 0;
            if (rxCopay > 1) { // Treat as a flat copay
                const cost = rxCopay * refills;
                personBreakdown.chargeDetails.exempt.push({
                  name: med.name || `Tier ${med.tier} Rx`,
                  calculation: `${refills} refill(s) × ${formatCurrency(rxCopay)}/refill`,
                  cost: cost
                });
            }
        }
    });

    // 2. Gather Deductible Applicable Charges
    const deductibleServices = [
      { type: 'emergencyRoom', visits: person.visits.emergencyRoom, cost: costs.emergencyRoom, planRate: plan.copays?.emergencyRoom || 0 },
      { type: 'diagnosticTest', visits: person.visits.diagnosticTest, cost: costs.diagnosticTest, planRate: plan.copays?.diagnosticTest || 0 },
      { type: 'imaging', visits: person.visits.imaging, cost: costs.imaging, planRate: plan.copays?.imaging || 0 },
      { type: 'rehabilitationOutpatient', visits: person.visits.rehabilitationOutpatient, cost: costs.rehabilitationOutpatient, planRate: plan.copays?.rehabilitationOutpatient || 0 },
      { type: 'habilitationOutpatient', visits: person.visits.habilitationOutpatient, cost: costs.habilitationOutpatient, planRate: plan.copays?.habilitationOutpatient || 0 },
    ];
    deductibleServices.forEach(service => {
        if (service.visits > 0) {
            const charge = service.visits * service.cost;
            personBreakdown.chargeDetails.deductible.push({
              name: formatVisitType(service.type),
              calculation: `${service.visits} visit(s) × ${formatCurrency(service.cost)}/visit`,
              cost: charge
            });
            if (service.planRate > 0 && service.planRate < 1) coinsuranceRate = service.planRate;
        }
    });
    person.medications.forEach(med => {
        const refills = med.refillsPerYear || 12;
        const customCost = parseFloat(med.customCost) || null;
        if (customCost) {
            const charge = customCost * refills;
            personBreakdown.chargeDetails.deductible.push({
              name: med.name || `Tier ${med.tier} Rx`,
              calculation: `${refills} refill(s) × ${formatCurrency(customCost)}/refill`,
              cost: charge
            });
        } else {
            const rxCopay = plan.rxCopays ? (plan.rxCopays['tier' + med.tier] || 0) : 0;
            if (rxCopay <= 1 && rxCopay > 0) { // Treat as coinsurance
                const estimatedDrugCost = 100; // Simplified assumption
                const charge = estimatedDrugCost * refills;
                personBreakdown.chargeDetails.deductible.push({
                  name: med.name || `Tier ${med.tier} Rx (est.)`,
                  calculation: `${refills} refill(s) × ${formatCurrency(estimatedDrugCost)}/refill`,
                  cost: charge
                });
                if (coinsuranceRate === 0) coinsuranceRate = rxCopay;
            }
        }
    });
    
    const totalExemptCopays = personBreakdown.chargeDetails.exempt.reduce((sum, item) => sum + item.cost, 0);
    const deductibleChargesCalc = personBreakdown.chargeDetails.deductible.map(c => formatCurrency(c.cost)).join(' + ') || formatCurrency(0);
    const totalDeductibleApplicableCharges = personBreakdown.chargeDetails.deductible.reduce((sum, item) => sum + item.cost, 0);

    personBreakdown.totalCharges = totalExemptCopays + totalDeductibleApplicableCharges;
    personBreakdown.calculations.totalCharges = `${formatCurrency(totalExemptCopays)} (copays) + ${formatCurrency(totalDeductibleApplicableCharges)} (charges)`;

    // Now, process the charges for this person
    let personDeductibleRemaining = individualDeductibleLimit;
    
    // Amount person pays towards their own deductible from applicable charges
    const contributionToDeductible = Math.min(totalDeductibleApplicableCharges, personDeductibleRemaining);
    personBreakdown.deductiblePaid = contributionToDeductible;
    personBreakdown.calculations.deductiblePaid = `min((${deductibleChargesCalc}) (from Charges), ${formatCurrency(personDeductibleRemaining)} (Plan Deductible))`;
    personDeductibleRemaining -= contributionToDeductible;

    // Check against remaining family deductible
    const familyDeductibleRemaining = Math.max(0, familyDeductibleLimit - familyDeductiblePaid);
    const effectiveDeductiblePaid = Math.min(personBreakdown.deductiblePaid, familyDeductibleRemaining);
    
    // Amount subject to coinsurance
    const chargesAfterDeductible = Math.max(0, totalDeductibleApplicableCharges - effectiveDeductiblePaid);
    personBreakdown.coinsurancePaid = chargesAfterDeductible * coinsuranceRate;
    personBreakdown.calculations.coinsurancePaid = `((${deductibleChargesCalc}) - ${formatCurrency(effectiveDeductiblePaid)} (from Deductible)) × ${coinsuranceRate * 100}%`;

    // Person's total OOP is sum of what they paid
    personBreakdown.totalOOP = totalExemptCopays + effectiveDeductiblePaid + personBreakdown.coinsurancePaid;
    personBreakdown.calculations.totalOOP = `${formatCurrency(totalExemptCopays)} (copays) + ${formatCurrency(effectiveDeductiblePaid)} (from Deductible) + ${formatCurrency(personBreakdown.coinsurancePaid)} (from Coinsurance)`;


    // Apply individual MOOP
    if (isFamilyPlan && personBreakdown.totalOOP > individualMOOPLimit) {
        personBreakdown.note = `Individual MOOP Hit`;
        personBreakdown.totalOOP = individualMOOPLimit;
    }
    
    // Add this person's contribution to the family totals
    familyDeductiblePaid += effectiveDeductiblePaid;
    familyOOPPaid += personBreakdown.totalOOP;
    
    personBreakdowns.push(personBreakdown);
  });

  // Apply family MOOP to the aggregated total
  const finalFamilyOOP = Math.min(familyOOPPaid, familyMOOPLimit);
  
  const grandTotal = annualPremium + finalFamilyOOP;

  return {
    premiumBreakdown: {
        annualPremium,
        monthlyPremium: plan.premium || 0,
        monthsPerYear: 12,
    },
    personBreakdowns,
    individualDeductibleLimit,
    familyDeductibleLimit,
    individualMOOPLimit,
    familyMOOPLimit,
    familyDeductiblePaid: Math.min(familyDeductiblePaid, familyDeductibleLimit),
    familyOOPTotal: familyOOPPaid,
    finalFamilyOOP,
    grandTotal
  };
}