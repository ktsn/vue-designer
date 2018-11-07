export interface WebSocketServer {
  clients: Set<WebSocket>
  on(event: 'connection', cb: (socket: WebSocket) => void): void
}

export interface WebSocket {
  send(payload: string): void
  on(event: 'message', cb: (message: string) => void): void
  on(event: 'error', cb: (error: Error) => void): void
  once(event: 'close', cb: () => void): void
}

export type Resolver = Record<string, (...args: any[]) => any>

export type Mutator = Record<string, (...args: any[]) => void>
