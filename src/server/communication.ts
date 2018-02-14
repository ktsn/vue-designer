import WebSocket from 'ws'
import { ServerPayload } from '../payload'
import { VueFilePayload } from '../parser/vue-file'

export function initProject(
  ws: WebSocket,
  vueFiles: Record<string, VueFilePayload>
): void {
  send(ws, {
    type: 'InitProject',
    vueFiles
  })
}

export function changeDocument(ws: WebSocket, uri: string): void {
  send(ws, {
    type: 'ChangeDocument',
    uri
  })
}

function send(ws: WebSocket, payload: ServerPayload): void {
  console.log('[send] ' + payload.type, payload)
  ws.send(JSON.stringify(payload))
}
