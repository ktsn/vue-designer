export function assert(
  condition: unknown,
  message?: string
): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

export function mapValues<T, R>(
  record: Record<string, T>,
  fn: (value: T, key: string) => R
): Record<string, R> {
  const res: Record<string, R> = {}
  Object.keys(record).forEach((key) => {
    res[key] = fn(record[key], key)
  })
  return res
}

export function takeWhile<T, R extends T>(
  list: T[],
  fn: (value: T) => value is R
): R[]
export function takeWhile<T>(list: T[], fn: (value: T) => boolean): T[]
export function takeWhile<T>(list: T[], fn: (value: T) => boolean): T[] {
  const res = []
  for (const item of list) {
    if (fn(item)) {
      res.push(item)
    } else {
      return res
    }
  }
  return res
}

export function dropWhile<T>(list: T[], fn: (value: T) => boolean): T[] {
  const skip = takeWhile(list, fn)
  return list.slice(skip.length)
}

export function flatten<T>(list: (T | T[])[]): T[] {
  return list.reduce<T[]>((acc, item) => {
    return acc.concat(item)
  }, [])
}

export function clone<T>(value: T, changes: any = {}): T {
  return {
    ...(value as any),
    ...changes,
  }
}

export function range(min: number, max: number): number[] {
  return Array.apply(null, Array(max - min + 1)).map(
    (_: any, i: number) => min + i
  )
}

export function minmax(min: number, n: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function isObject(value: any): boolean {
  return value !== null && typeof value === 'object'
}

export function unquote(str: string): string {
  const quotes = str[0] + str[str.length - 1]
  if (quotes === "''" || quotes === '""') {
    return str.slice(1, -1)
  } else {
    return str
  }
}
