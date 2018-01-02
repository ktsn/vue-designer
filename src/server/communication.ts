import * as WebSocket from 'ws'
import { ServerPayload } from '../payload'
import { VueFile } from '../parser/vue-file'

export function initDocument(ws: WebSocket, vueFile: VueFile): void {
  send(ws, {
    type: 'InitDocument',
    vueFile
  })
}

function send(ws: WebSocket, payload: ServerPayload): void {
  console.log('[send] ' + payload.type, payload)
  ws.send(JSON.stringify(payload))
}
