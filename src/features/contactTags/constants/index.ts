// Tag names and descriptions: Arabic fields hold Arabic with no Latin letters, and no field is digits alone.
export const TAG_TEXT_PATTERN = {
  LATIN_LETTER: /[A-Za-z]/,
  ARABIC_LETTER: /[ء-يٮ-ۓۺ-ۿ]/,
  DIGITS_ONLY: /^[\s0-9٠-٩۰-۹]+$/,
} as const;

export type TagTextField = 'nameEn' | 'nameAr' | 'descriptionEn' | 'descriptionAr';

export const TAG_TEXT_FIELDS: { field: TagTextField; arabic: boolean }[] = [
  { field: 'nameEn', arabic: false },
  { field: 'nameAr', arabic: true },
  { field: 'descriptionEn', arabic: false },
  { field: 'descriptionAr', arabic: true },
];
