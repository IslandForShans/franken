/**
 * Calculates resource/influence totals in TI4 style
 * - Total: Sum of all resource values / Sum of all influence values
 * - Optimal: Assign each planet to R or I based on which is higher
 * - Flex: Planets where R equals I (can be used for either)
 * 
 * @param {Array} planets - Array of planet objects with resource and influence properties
 * @returns {Object} - { totalResource, totalInfluence, optimalResource, optimalInfluence, flexCount, flexValue, assignment }
 */
export function calculateOptimalResources(planets) {
  if (!planets || planets.length === 0) {
    return {
      totalResource: 0,
      totalInfluence: 0,
      optimalResource: 0,
      optimalInfluence: 0,
      flexCount: 0,
      flexValue: 0,
      assignment: []
    };
  }

  const totalResource = planets.reduce((sum, p) => sum + (p.resource || 0), 0);
  const totalInfluence = planets.reduce((sum, p) => sum + (p.influence || 0), 0);

  let optimalResource = 0;
  let optimalInfluence = 0;
  let flexValue = 0;
  let flexCount = 0;
  const assignment = [];

  planets.forEach(planet => {
    const resource = planet.resource || 0;
    const influence = planet.influence || 0;

    if (resource > influence) {
      // Resource is higher - assign to resources
      optimalResource += resource;
      assignment.push({ planet, usedFor: 'resource', type: 'resource-dominant' });
    } else if (influence > resource) {
      // Influence is higher - assign to influence
      optimalInfluence += influence;
      assignment.push({ planet, usedFor: 'influence', type: 'influence-dominant' });
    } else {
      // Equal values - this is flex
      flexValue += resource; // Could be either R or I
      flexCount++;
      assignment.push({ planet, usedFor: 'flex', type: 'flex' });
    }
  });

  return {
    totalResource,
    totalInfluence,
    optimalResource,
    optimalInfluence,
    flexCount,
    flexValue,
    assignment
  };
}

/**
 * Format the optimal resource calculation for display
 */
export function formatResourceSummary(planets) {
  const result = calculateOptimalResources(planets);
  
  return {
    ...result,
    summary: `${result.optimalResource}R / ${result.optimalInfluence}I optimal (${result.flexValue} flex)`,
    totalSummary: `${result.totalResource}R / ${result.totalInfluence}I total`
  };
}