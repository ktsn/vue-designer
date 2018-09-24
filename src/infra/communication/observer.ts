export interface Observer<T> {
  onAdd(value: T): void
  onUpdate(value: T): void
  onRemove(value: T): void
}
