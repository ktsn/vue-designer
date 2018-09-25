import { EventEmitter } from 'events'
import { WebSocket, WebSocketServer } from '@/infra/communication/connect'

export class MockWebSocketServer extends EventEmitter
  implements WebSocketServer {
  connectClient(): MockWebSocketClient {
    const client = new MockWebSocketClient()
    this.emit('connection', client.connection)
    return client
  }
}

class MockWebSocketClient {
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
  constructor(private client: MockWebSocketClient) {
    super()
  }

  send(payload: string): void {
    this.client.pushMessage(payload)
  }
}
