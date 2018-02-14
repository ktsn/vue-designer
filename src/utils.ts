export function mapValues<T, R>(
  record: Record<string, T>,
  fn: (value: T, key: string) => R
): Record<string, R> {
  const res: Record<string, R> = {}
  Object.keys(record).forEach(key => {
    res[key] = fn(record[key], key)
  })
  return res
}
