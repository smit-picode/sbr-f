// Per-source badge palette shared by anything that displays a regulator SOURCE_CODE (e.g.
// LegalUnitColumns' Source column, FieldHistoryPopover's "Provided by regulator" line). Each
// source keeps its own hue for at-a-glance recognition, as a soft tint with dark text rather
// than a solid dark block — the text shades are deliberately a step darker than a flat tint
// (QFZ #2B7A9E -> #22637F, QSTP #B5742B -> #8F5C22) since at 12px on a tint the originals fall
// below the 4.5:1 contrast floor the design system requires for small text. Kept as inline hex,
// as the solid version was, because these regulator colours sit outside the
// slate/blue/emerald/red/amber Tailwind palette.
export const SOURCE_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  MOCI:     { bg: '#F4F0E8', text: '#A29374', border: '#E4DAC7' },
  QFC:      { bg: '#EEF2F6', text: '#1A3A52', border: '#D6DFE8' },
  QFZ:      { bg: '#E9F4F8', text: '#22637F', border: '#CFE6EF' },
  QSTP:     { bg: '#FDF3E7', text: '#8F5C22', border: '#F5E2C8' },
  MOM_FARM: { bg: '#E8F5EE', text: '#196E49', border: '#C9E7D8' },
};

// Neutral slate for a source the palette above doesn't know, so an unrecognised value still
// renders as a badge rather than bare text.
export const SOURCE_BADGE_FALLBACK = { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };
