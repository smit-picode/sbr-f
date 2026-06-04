export function cleanParams<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  ) as Partial<T>;
}
