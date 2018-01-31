import { ServerPayload, ClientPayload } from '../payload'

export class ClientConnection {
  private ws: WebSocket | undefined
  private listeners: ((data: ServerPayload) => void)[] = []

  connect(port: string): void {
    this.ws = new WebSocket(`ws://localhost:${port}/api`)
    this.ws.addEventListener('message', event => {
      this.listeners.forEach(fn => {
        fn(JSON.parse(event.data))
      })
    })
  }

  send(payload: ClientPayload): void {
    if (!this.ws) throw new Error('WebSocket connection is not established yet')
    this.ws.send(JSON.stringify(payload))
  }

  onMessage(fn: (data: ServerPayload) => void): () => void {
    this.listeners.push(fn)
    return () => {
      const index = this.listeners.indexOf(fn)
      if (index >= 0) {
        this.listeners.splice(index, 1)
      }
    }
  }
}
