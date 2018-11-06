import assert from 'assert'
import { WebSocketServer, WebSocket, Resolver, Mutator } from './types'

export interface ConnectConfig {
  resolver: Resolver
  mutator: Mutator
  server: WebSocketServer
}

export function connectWsServer({
  resolver,
  mutator,
  server
}: ConnectConfig): void {
  server.on('connection', ws => {
    listenMessage(ws, resolver, mutator)
  })
}

function listenMessage(ws: WebSocket, resolver: Resolver, mutator: Mutator) {
  ws.on('message', async message => {
    const data = JSON.parse(message.toString())

    assert(typeof data.type === 'string')
    assert(Array.isArray(data.args))
    assert('requestId' in data)

    const [type, method] = data.type.split(':')
    const target = type === 'resolver' ? resolver : mutator

    assert(type === 'resolver' || type === 'mutator')
    assert(typeof target[method] === 'function')

    const res = await target[method].apply(target, data.args)
    ws.send(
      JSON.stringify({
        type: data.type,
        data: res,
        requestId: data.requestId
      })
    )
  })
}
