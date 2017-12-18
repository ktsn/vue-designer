import { ServerPayload, ClientPayload } from "../payload";
import { DocumentProvider } from "./document";

export class ClientConnection implements DocumentProvider {
  private ws: WebSocket | null = null
  private onMessages: ((data: ServerPayload) => void)[] = []

  connect(port: string): void {
    this.ws = new WebSocket(`ws://localhost:${port}`)
    this.ws.addEventListener('message', event => {
      this.onMessages.forEach(fn => {
        fn(JSON.parse(event.data))
      })
    })
  }

  send(payload: ClientPayload): void {
    if (!this.ws) throw new Error('WebSocket connection is not established yet')
    this.ws.send(JSON.stringify(payload))
  }

  onInitDocument(fn: (template: string, style: string) => void): void {
    this.onMessages.push(data => {
      if (data.type === 'init-document') {
        fn(data.template, data.style)
      }
    })
  }
}