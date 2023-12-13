import { WebSocketServer } from './types'

export class Subject<T extends Record<string, any>> {
  constructor(private server: WebSocketServer) {}

  notify<K extends keyof T & string>(key: K, data: T[K]) {
    this.server.clients.forEach(ws => {
      ws.send(
        JSON.stringify({
          type: 'subject:' + key,
          data
        })
      )
    })
  }
}
