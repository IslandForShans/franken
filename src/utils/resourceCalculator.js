/**
 * Calculates the optimal assignment of planets to maximize balanced R/I
 * In TI4, you exhaust each planet for EITHER resources OR influence
 * Goal: Maximize min(total_resources, total_influence)
 * 
 * @param {Array} planets - Array of planet objects with resource and influence properties
 * @returns {Object} - { optimal, leftoverResource, leftoverInfluence, totalResource, totalInfluence, assignment }
 */
export function calculateOptimalResources(planets) {
  if (!planets || planets.length === 0) {
    return {
      optimal: 0,
      leftoverResource: 0,
      leftoverInfluence: 0,
      totalResource: 0,
      totalInfluence: 0,
      assignment: []
    };
  }

  const totalResource = planets.reduce((sum, p) => sum + (p.resource || 0), 0);
  const totalInfluence = planets.reduce((sum, p) => sum + (p.influence || 0), 0);

  // Try to find the best assignment using a greedy approach
  // Strategy: Start with all planets assigned to maximize the lower total
  // Then optimize by swapping planets to balance
  
  let bestOptimal = 0;
  let bestAssignment = [];
  let bestLeftoverR = 0;
  let bestLeftoverI = 0;

  // Try all possible assignments (2^n combinations)
  // For each planet, we can choose to exhaust for resources (0) or influence (1)
  const numPlanets = planets.length;
  const totalCombinations = Math.pow(2, numPlanets);

  for (let combo = 0; combo < totalCombinations; combo++) {
    let currentResources = 0;
    let currentInfluence = 0;
    const assignment = [];

    for (let i = 0; i < numPlanets; i++) {
      const exhaustForInfluence = (combo >> i) & 1;
      
      if (exhaustForInfluence) {
        currentInfluence += planets[i].influence || 0;
        assignment.push({ planet: planets[i], usedFor: 'influence' });
      } else {
        currentResources += planets[i].resource || 0;
        assignment.push({ planet: planets[i], usedFor: 'resource' });
      }
    }

    const optimal = Math.min(currentResources, currentInfluence);
    
    if (optimal > bestOptimal) {
      bestOptimal = optimal;
      bestAssignment = assignment;
      bestLeftoverR = currentResources - optimal;
      bestLeftoverI = currentInfluence - optimal;
    }
  }

  return {
    optimal: bestOptimal,
    leftoverResource: bestLeftoverR,
    leftoverInfluence: bestLeftoverI,
    totalResource,
    totalInfluence,
    assignment: bestAssignment
  };
}

/**
 * Format the optimal resource calculation for display
 */
export function formatResourceSummary(planets) {
  const result = calculateOptimalResources(planets);
  
  return {
    ...result,
    summary: `${result.optimal} optimal pairs (${result.leftoverResource}R + ${result.leftoverInfluence}I leftover)`,
    canFlexTo: result.leftoverResource + result.leftoverInfluence
  };
}