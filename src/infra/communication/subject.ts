import { Observer } from './types'

export class Subject<T> {
  private observers = new Set<Observer<T>>()

  on(observer: Observer<T>): void {
    this.observers.add(observer)
  }

  off(observer: Observer<T>): void {
    this.observers.delete(observer)
  }

  notifyAdd(value: T): void {
    this.observers.forEach(ob => {
      ob.onAdd(value)
    })
  }

  notifyUpdate(value: T): void {
    this.observers.forEach(ob => {
      ob.onUpdate(value)
    })
  }

  notifyRemove(value: T): void {
    this.observers.forEach(ob => {
      ob.onRemove(value)
    })
  }
}
