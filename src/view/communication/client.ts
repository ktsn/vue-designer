import { Resolver, Mutator } from '@/infra/communication/types'
import { assert } from '@/utils'

type Arguments<F extends Function> = F extends (...args: infer T) => any
  ? T
  : never

type Unwrap<T> = T extends Promise<infer R> ? R : T

export type CommunicationClientObserver<T extends Record<string, any>> = {
  [K in keyof T]: (data: T[K]) => void
}

export interface CommunicationClientConfig {
  ws: WebSocketClient
}

export interface WebSocketClient {
  addEventListener(event: 'open', fn: () => void): void
  addEventListener(event: 'message', fn: (event: MessageEvent) => void): void
  removeEventListener(event: 'message', fn: (event: MessageEvent) => void): void
  send(payload: string): void
}

export class CommunicationClient<
  R extends Resolver,
  M extends Mutator,
  S extends Record<string, any>
> {
  private ws: WebSocketClient
  private nextRequestId = 1
  private observers: Set<CommunicationClientObserver<S>> = new Set()

  private onEvent = (event: MessageEvent) => {
    const data = JSON.parse(event.data)

    assert(typeof data.type === 'string')
    const [type, method] = data.type.split(':')

    if (type !== 'subject') {
      return
    }

    this.observers.forEach(ob => {
      const f = ob[method]
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

  onReady(fn: () => void): void {
    this.ws.addEventListener('open', fn)
  }

  resolve<K extends keyof R & string>(
    key: K,
    ...args: Arguments<R[K]>
  ): Promise<Unwrap<ReturnType<R[K]>>> {
    return this.genericRequest('resolver', key, args, this.nextRequestId++)
  }

  mutate<K extends keyof M & string>(
    key: K,
    ...args: Arguments<M[K]>
  ): Promise<Unwrap<ReturnType<M[K]>>> {
    return this.genericRequest('mutator', key, args, this.nextRequestId++)
  }

  observe(observer: CommunicationClientObserver<S>): () => void {
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
    K extends keyof T & string
  >(
    type: string,
    key: K,
    args: Arguments<T[K]>,
    requestId: number
  ): Promise<Unwrap<ReturnType<T[K]>>> {
    return new Promise(resolve => {
      const combinedType = type + ':' + key

      const receive = (event: MessageEvent): void => {
        const data = JSON.parse(event.data)

        assert(typeof data.type === 'string')
        if (data.type !== combinedType) {
          return
        }

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
