export interface Observer<T> {
  onAdd(value: T): void
  onUpdate(value: T): void
  onRemove(value: T): void
}

export type Resolver<T> = Record<
  string,
  (...args: any[]) => T | T[] | undefined
>

export type Mutator = Record<string, (...args: any[]) => void>
