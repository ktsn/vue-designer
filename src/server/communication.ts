import WebSocket from 'ws'
import { ServerPayload } from '../payload'
import { VueFilePayload } from '../parser/vue-file'
import { RuleForPrint } from '../parser/style/types'

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

export function matchRules(ws: WebSocket, rules: RuleForPrint[]): void {
  send(ws, {
    type: 'MatchRules',
    rules
  })
}

function send(ws: WebSocket, payload: ServerPayload): void {
  console.log('[send] ' + payload.type, payload)
  ws.send(JSON.stringify(payload))
}
