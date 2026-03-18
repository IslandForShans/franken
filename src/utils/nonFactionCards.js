const DEFAULT_TYPE_LABELS = {
  explores: "Explore",
  relics: "Relic",
  action_cards: "Action Card",
  agendas: "Agenda",
  technologies: "Technology",
  promissory: "Promissory",
};

const slugify = (value) =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";

const ensureArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const normalizeCard = ({
  card,
  typeKey,
  subtype,
  source,
  modId,
  typeLabel,
}) => {
  if (!card || typeof card !== "object") return null;

  const name = String(card.name ?? "").trim();
  const text = String(card.text ?? card.description ?? "").trim();
  if (!name || !text) return null;

  const id =
    card.id ||
    `${modId}.${typeKey}${subtype ? `.${slugify(subtype)}` : ""}.${slugify(name)}`;

  return {
    id,
    name,
    type: typeLabel,
    typeKey,
    subtype: subtype || card.subtype || null,
    source: card.source || source,
    modId,
    amount: card.amount,
    text,
    note: card.note || null,
    deck: card.deck || null,
    tags: ensureArray(card.tags),
    version: card.version || null,
    replace: Boolean(card.replace),
  };
};

const flattenTypeEntries = ({
  entries,
  typeKey,
  typeLabel,
  source,
  modId,
  subtype,
}) => {
  return ensureArray(entries).flatMap((entry) => {
    if (!entry) return [];

    if (Array.isArray(entry)) {
      return flattenTypeEntries({
        entries: entry,
        typeKey,
        typeLabel,
        source,
        modId,
        subtype,
      });
    }

    if (typeof entry !== "object") return [];

    if (entry.name) {
      const card = normalizeCard({
        card: entry,
        typeKey,
        subtype,
        source,
        modId,
        typeLabel,
      });
      return card ? [card] : [];
    }

    return Object.entries(entry).flatMap(([nestedSubtype, nestedEntries]) =>
      flattenTypeEntries({
        entries: nestedEntries,
        typeKey,
        typeLabel,
        source,
        modId,
        subtype: subtype || nestedSubtype,
      }),
    );
  });
};

const normalizePackCards = ({
  cardsByType,
  source,
  modId,
  typeLabels = {},
}) => {
  return Object.entries(cardsByType || {}).flatMap(([typeKey, entries]) => {
    const typeLabel =
      typeLabels[typeKey] || DEFAULT_TYPE_LABELS[typeKey] || typeKey;

    return flattenTypeEntries({
      entries,
      typeKey,
      typeLabel,
      source,
      modId,
      subtype: null,
    });
  });
};

export const buildNonFactionCatalog = (packs = []) => {
  const byId = new Map();

  packs.forEach((pack) => {
    if (!pack) return;
    const modId = pack.meta?.id || "pack";
    const source = pack.meta?.source || "Unknown";
    const cards = normalizePackCards({
      cardsByType: pack.cards,
      source,
      modId,
      typeLabels: pack.typeLabels,
    });

    cards.forEach((card) => {
      if (card.replace || !byId.has(card.id)) {
        byId.set(card.id, card);
      }
    });
  });

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
};
