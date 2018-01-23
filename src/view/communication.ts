import { ServerPayload, ClientPayload } from '../payload'
import { DocumentProvider } from './document'
import { VueFile } from '../parser/vue-file'

export class ClientConnection implements DocumentProvider {
  private ws: WebSocket | undefined
  private onMessages: ((data: ServerPayload) => void)[] = []

  connect(port: string): void {
    this.ws = new WebSocket(`ws://localhost:${port}/api`)
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

  onInitDocument(fn: (vueFile: VueFile) => void): void {
    this.onMessages.push(data => {
      if (data.type === 'InitDocument') {
        fn(data.vueFile)
      }
    })
  }
}
