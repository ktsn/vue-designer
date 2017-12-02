import * as http from 'http'
import { startStaticServer } from "./static"

interface Server {
  readonly staticServer: http.Server
}

export function startServer(): Server {
  const staticServer = startStaticServer()
  return {
    staticServer
  }
}

export function disposeServer(server: Server): void {
  server.staticServer.close()
}