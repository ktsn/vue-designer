export function mapFindRight<T, R>(
  list: T[],
  fn: (value: T) => R | undefined
): R | undefined {
  return list
    .slice()
    .reverse()
    .map(fn)
    .find(v => v !== undefined)
}
