const EXTRA_COMPONENT_CATEGORY_OVERRIDES = {
  "Artuno the Betrayer": "agents",
  "The Thundarian": "agents",
  Awaken: "abilities",
  Coalescence: "abilities",
  Devour: "abilities",
  "Dark Pact": "promissory",
  "Ghoti Home System": "home_systems",
};

export function getExtraComponentCategory(extraComponent, fallbackCategory) {
  return (
    EXTRA_COMPONENT_CATEGORY_OVERRIDES[extraComponent.name] ||
    extraComponent.category ||
    fallbackCategory
  );
}

export function getForcedComponentCategory(forcedComponent, fallbackCategory) {
  return forcedComponent.category || fallbackCategory;
}

export function createExtraComponent(
  extraComponent,
  triggerComponent,
  fullComponentData,
) {
  if (fullComponentData) {
    return {
      ...fullComponentData,
      isExtra: true,
      triggerComponent: triggerComponent.name,
    };
  }

  return {
    ...extraComponent,
    isExtra: true,
    triggerComponent: triggerComponent.name,
    description:
      extraComponent.description || `Gained from ${triggerComponent.name}`,
    faction: extraComponent.faction || triggerComponent.faction,
    icon:
      extraComponent.icon ||
      triggerComponent.icon ||
      triggerComponent.factionIcon,
    factionIcon:
      extraComponent.factionIcon ||
      triggerComponent.factionIcon ||
      triggerComponent.icon,
  };
}

export function createForcedComponent(
  forcedComponent,
  triggerComponent,
  fullComponentData,
) {
  if (fullComponentData) {
    return {
      ...fullComponentData,
      isForced: true,
      triggerComponent: triggerComponent.name,
    };
  }

  return {
    ...forcedComponent,
    isForced: true,
    triggerComponent: triggerComponent.name,
    faction: forcedComponent.faction || triggerComponent.faction,
  };
}

export function hasExtraComponent(components, componentName) {
  return components.some(
    (component) => component.name === componentName && component.isExtra,
  );
}

export function isTriggeredExtraComponent(
  component,
  extraComponent,
  triggerComponent,
) {
  return (
    component.isExtra &&
    component.triggerComponent === triggerComponent.name &&
    component.name === extraComponent.name
  );
}

function isTriggeredComponent(component, triggerComponent) {
  return component.triggerComponent === triggerComponent.name;
}

export function isTriggeredSwapComponent(component, triggerComponent) {
  return component.isSwap && isTriggeredComponent(component, triggerComponent);
}

export function isTriggeredForcedComponent(component, triggerComponent) {
  return component.isForced && isTriggeredComponent(component, triggerComponent);
}

export function isTriggeredSwapOrForcedComponent(component, triggerComponent) {
  return (
    (component.isSwap || component.isForced) &&
    isTriggeredComponent(component, triggerComponent)
  );
}
