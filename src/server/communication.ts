import * as WebSocket from 'ws'
import { ServerPayload } from "../payload";

export function initDocument(ws: WebSocket, template: string, style: string): void {
  send(ws, {
    type: 'init-document',
    template,
    style
  })
}

function send(ws: WebSocket, payload: ServerPayload): void {
  console.log('[send] ' + payload.type, payload)
  ws.send(JSON.stringify(payload))
}
