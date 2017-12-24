import * as WebSocket from 'ws'
import { ServerPayload } from '../payload'
import { Template } from '../parser/template'

export function initDocument(
  ws: WebSocket,
  template: Template | null,
  styles: string[]
): void {
  send(ws, {
    type: 'InitDocument',
    template,
    styles
  })
}

function send(ws: WebSocket, payload: ServerPayload): void {
  console.log('[send] ' + payload.type, payload)
  ws.send(JSON.stringify(payload))
}
