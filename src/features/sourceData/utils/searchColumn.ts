import type { SourceTableColumn } from '@/types';
import {
  ARABIC_TEXT_PATTERN,
  CR_NUMBER_QUERY_PATTERN,
  SOURCE_SEARCH_ARABIC_COLUMN_PATTERN,
  SOURCE_SEARCH_CR_COLUMN_PATTERN,
  SOURCE_SEARCH_ENGLISH_COLUMN_PATTERN,
  SOURCE_SEARCH_NAME_PATTERN,
} from '../constants';

export const searchableColumns = (columns: SourceTableColumn[]): string[] =>
  columns.filter((c) => c.KIND === 'text').map((c) => c.COLUMN_NAME);

// The column a search runs on when the user has not picked one: the CR column for a CR number, else the name column in the query's script.
export const defaultSearchColumn = (columns: SourceTableColumn[], query: string): string | undefined => {
  const text = searchableColumns(columns);
  const crColumn = text.find((c) => SOURCE_SEARCH_CR_COLUMN_PATTERN.test(c));
  if (crColumn && CR_NUMBER_QUERY_PATTERN.test(query.trim())) return crColumn;
  const names = text.filter((c) => SOURCE_SEARCH_NAME_PATTERN.test(c));
  const arabic = names.filter((c) => SOURCE_SEARCH_ARABIC_COLUMN_PATTERN.test(c));
  const english = names.filter((c) => SOURCE_SEARCH_ENGLISH_COLUMN_PATTERN.test(c));
  const plain = names.filter((c) => !arabic.includes(c));
  const preferred = ARABIC_TEXT_PATTERN.test(query) ? arabic : [...english, ...plain];
  return preferred[0] ?? names[0] ?? text[0];
};
