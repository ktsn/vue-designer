import assert from 'assert'
import { Resolver, Mutator } from '@/infra/communication/types'

type Arguments<F extends Function> = F extends (...args: infer T) => any
  ? T
  : never

export interface CommunicationClientConfig {
  ws: WebSocketClient
}

export interface WebSocketClient {
  addEventListener(event: 'message', fn: (payload: string) => void): void
  removeEventListener(event: 'message', fn: (payload: string) => void): void
  send(payload: string): void
}

export class CommunicationClient<R extends Resolver<{}>, M extends Mutator> {
  private ws: WebSocketClient
  private nextRequestId = 1

  constructor(config: CommunicationClientConfig) {
    this.ws = config.ws
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
      const receive = (payload: string): void => {
        const data = JSON.parse(payload)

        assert(typeof data.type === 'string')
        assert('data' in data)
        assert('requestId' in data)

        if (data.requestId === requestId) {
          resolve(data.data)
          this.ws.removeEventListener('message', receive)
        }
      }

      this.ws.send(
        JSON.stringify({
          type: type + ':' + key,
          args,
          requestId
        })
      )

      this.ws.addEventListener('message', receive)
    })
  }
}
