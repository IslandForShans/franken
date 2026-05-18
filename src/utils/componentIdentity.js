export function isSameComponent(firstComponent, secondComponent) {
  return (
    firstComponent?.name === secondComponent?.name &&
    firstComponent?.faction === secondComponent?.faction
  );
}

export function hasComponent(components, component) {
  return components.some((candidate) => isSameComponent(candidate, component));
}
