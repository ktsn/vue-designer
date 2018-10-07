import assert from 'assert'
import { Resolver, Mutator } from '@/infra/communication/types'

type ResolverModel<R extends Resolver<{}>> = R extends Resolver<infer T>
  ? T
  : never

type Arguments<F extends Function> = F extends (...args: infer T) => any
  ? T
  : never

export interface CommunicationClientObserver<T> {
  onAdd?: (value: T) => void
  onUpdate?: (value: T) => void
  onRemove?: (value: T) => void
}

export interface CommunicationClientConfig {
  ws: WebSocketClient
}

export interface WebSocketClient {
  addEventListener(event: 'message', fn: (payload: string) => void): void
  removeEventListener(event: 'message', fn: (payload: string) => void): void
  send(payload: string): void
}

export class CommunicationClient<
  R extends Resolver<{}>,
  M extends Mutator,
  T = ResolverModel<R>
> {
  private ws: WebSocketClient
  private nextRequestId = 1
  private observers: Set<CommunicationClientObserver<T>> = new Set()

  private onEvent = (payload: string) => {
    const data = JSON.parse(payload)

    assert(typeof data.type === 'string')
    const [type, operation] = data.type.split(':')

    if (type !== 'subject') {
      return
    }

    assert('data' in data)

    let getMethod: (
      ob: CommunicationClientObserver<T>
    ) => ((value: T) => void) | undefined
    switch (operation) {
      case 'add':
        getMethod = ob => ob.onAdd
        break
      case 'update':
        getMethod = ob => ob.onUpdate
        break
      case 'remove':
        getMethod = ob => ob.onRemove
        break
      default:
        assert.fail('Unexpected type name: ' + data.type)
    }

    this.observers.forEach(ob => {
      const f = getMethod(ob)
      if (f) {
        f(data.data)
      }
    })
  }

  constructor(config: CommunicationClientConfig) {
    this.ws = config.ws

    // Observe the events from subject
    this.ws.addEventListener('message', this.onEvent)
  }

  resolve<K extends keyof R>(
    key: K,
    ...args: Arguments<R[K]>
  ): Promise<ReturnType<R[K]>> {
    return this.genericRequest('resolver', key, args, this.nextRequestId++)
  }

  mutate<K extends keyof M>(
    key: K,
    ...args: Arguments<M[K]>
  ): Promise<ReturnType<M[K]>> {
    return this.genericRequest('mutator', key, args, this.nextRequestId++)
  }

  observe(observer: CommunicationClientObserver<T>): () => void {
    this.observers.add(observer)
    return () => {
      this.observers.delete(observer)
    }
  }

  dispose(): void {
    this.ws.removeEventListener('message', this.onEvent)
  }

  private genericRequest<
    T extends Record<string, (...args: any[]) => any>,
    K extends keyof T
  >(
    type: string,
    key: K,
    args: Arguments<T[K]>,
    requestId: number
  ): Promise<ReturnType<T[K]>> {
    return new Promise(resolve => {
      const combinedType = type + ':' + key

      const receive = (payload: string): void => {
        const data = JSON.parse(payload)

        assert(typeof data.type === 'string')
        if (data.type !== combinedType) {
          return
        }

        assert('data' in data)
        assert('requestId' in data)

        if (data.requestId === requestId) {
          resolve(data.data)
          this.ws.removeEventListener('message', receive)
        }
      }

      this.ws.send(
        JSON.stringify({
          type: combinedType,
          args,
          requestId
        })
      )

      this.ws.addEventListener('message', receive)
    })
  }
}
