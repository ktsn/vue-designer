import * as WebSocket from 'ws'
import { ServerPayload } from '../payload'
import { Template } from '../parser/template'
import { Prop } from '../parser/script'

export function initDocument(
  ws: WebSocket,
  template: Template | null,
  props: Prop[],
  styles: string[]
): void {
  send(ws, {
    type: 'InitDocument',
    template,
    props,
    styles
  })
}

function send(ws: WebSocket, payload: ServerPayload): void {
  console.log('[send] ' + payload.type, payload)
  ws.send(JSON.stringify(payload))
}
