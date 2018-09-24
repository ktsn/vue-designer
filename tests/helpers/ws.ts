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

  constructor() {
    this.connection = new MockWebSocket(this)
  }

  send(payload: any): void {
    this.connection.emit('message', JSON.stringify(payload))
  }

  close(): void {
    this.connection.emit('close')
  }
}

class MockWebSocket extends EventEmitter implements WebSocket {
  constructor(private client: MockWebSocketClient) {
    super()
  }

  send(payload: string): void {
    this.client.received.push(JSON.parse(payload))
  }
}
