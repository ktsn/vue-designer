import { EventEmitter } from 'events'
import { WebSocket, WebSocketServer } from '@/infra/communication/types'
import { WebSocketClient } from '@/view/communication/client'

export class MockWebSocketServer extends EventEmitter
  implements WebSocketServer {
  clients = new Set<WebSocket>()

  connectClient(): MockWebSocketClientForServer {
    const client = new MockWebSocketClientForServer()

    this.clients.add(client.connection)

    this.emit('connection', client.connection)
    return client
  }
}

export class MockWebSocketClient extends EventEmitter
  implements WebSocketClient {
  sent: any[] = []

  send(payload: string): void {
    this.sent.push(JSON.parse(payload))
  }

  receive(payload: any): void {
    this.emit('message', { data: JSON.stringify(payload) })
  }

  addEventListener(event: 'open', cb: () => void): void
  addEventListener(event: 'message', cb: (event: MessageEvent) => void): void
  addEventListener(event: string, cb: (...args: any[]) => void): void {
    this.on(event, cb)
  }

  removeEventListener(
    event: 'message',
    cb: (event: MessageEvent) => void
  ): void {
    this.removeListener(event, cb)
  }
}

class MockWebSocketClientForServer {
  connection: MockWebSocket
  received: any[] = []
  private closed = false

  constructor() {
    this.connection = new MockWebSocket(this)
  }

  send(payload: any): void {
    this.assertConnection()
    this.connection.emit('message', JSON.stringify(payload))
  }

  close(): void {
    this.assertConnection()
    this.connection.emit('close')
    this.closed = true
  }

  pushMessage(payload: string): void {
    this.assertConnection()
    this.received.push(JSON.parse(payload))
  }

  assertConnection(): void {
    if (this.closed) {
      throw new Error('already closed')
    }
  }
}

class MockWebSocket extends EventEmitter implements WebSocket {
  constructor(private client: MockWebSocketClientForServer) {
    super()
  }

  send(payload: string): void {
    this.client.pushMessage(payload)
  }
}
