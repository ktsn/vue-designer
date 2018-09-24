import assert from 'assert'
import { Subject } from './subject'
import { Observer } from './observer'

type Resolver<T> = Record<string, (...args: any[]) => T | T[] | undefined>
type Mutator = Record<string, (...args: any[]) => void>

export interface WebSocketServer {
  on(event: 'connection', cb: (socket: WebSocket) => void): void
}

export interface WebSocket {
  send(payload: string): void
  on(event: 'message', cb: (message: string) => void): void
  once(event: 'close', cb: () => void): void
}

export interface ConnectConfig<T> {
  resolver: Resolver<T>
  mutator: Mutator
  subject: Subject<T>
  server: WebSocketServer
}

export function connectWsServer<T>({
  resolver,
  mutator,
  subject,
  server
}: ConnectConfig<T>): void {
  server.on('connection', ws => {
    connectSubject(ws, subject)
    listenMessage(ws, resolver, mutator)
  })
}

function listenMessage(
  ws: WebSocket,
  resolver: Resolver<{}>,
  mutator: Mutator
) {
  ws.on('message', message => {
    const data = JSON.parse(message.toString())
    const [type, method] = data.type.split(':')
    const target = type === 'resolver' ? resolver : mutator

    assert(type === 'resolver' || type === 'mutator')
    assert(Array.isArray(data.args))
    assert(typeof data.requestId === 'string')
    assert(typeof method === 'string')
    assert(typeof target[method] === 'function')

    const res = target[method].apply(target, data.args)
    ws.send(
      JSON.stringify({
        type: data.type,
        data: res,
        requestId: data.requestId
      })
    )
  })
}

function connectSubject(ws: WebSocket, subject: Subject<{}>): void {
  const observer: Observer<{}> = {
    onAdd(data) {
      ws.send(
        JSON.stringify({
          type: 'subject:add',
          data
        })
      )
    },

    onUpdate(data) {
      ws.send(
        JSON.stringify({
          type: 'subject:update',
          data
        })
      )
    },

    onRemove(data) {
      ws.send(
        JSON.stringify({
          type: 'subject:remove',
          data
        })
      )
    }
  }

  subject.on(observer)
  ws.once('close', () => {
    subject.off(observer)
  })
}
