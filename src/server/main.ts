import assert from 'assert'
import * as path from 'path'
import * as fs from 'fs'
import * as http from 'http'
import WebSocket from 'ws'
import { ClientPayload } from '../payload'

function readContent(
  file: string,
  cb: (err: Error, content: string) => void
): void {
  fs.readFile(path.join(__dirname, '..', file), 'utf8', cb)
}

const html = `<html>
<body>
  <div id="app"></div>
  <script src="/vue-designer-view.js"></script>
</body>
</html>`

const allowedUrls = ['/vue-designer-view.js']

function startStaticServer(): http.Server {
  const server = http.createServer((req, res) => {
    if (req.headers.host && !/^localhost(:\d+)?$/.test(req.headers.host)) {
      res.statusCode = 403
      res.end()
      return
    }

    if (req.url === '/' || req.url === '/index.html') {
      res.end(html)
      return
    }

    if (req.url && allowedUrls.indexOf(req.url) >= 0) {
      readContent(req.url, (err, content) => {
        assert(!err, 'Unexpectedly file not found')
        res.end(content)
      })
      return
    }

    res.statusCode = 404
    res.end()
  })

  const port = process.env.DEV ? 50001 : 0
  server.listen(port)

  return server
}

function startWebSocketServer(
  http: http.Server,
  onConnection: (ws: WebSocket) => void,
  onMessage: (ws: WebSocket, payload: ClientPayload) => void
): WebSocket.Server {
  const wss = new WebSocket.Server({
    host: 'localhost',
    server: http,
    path: '/api'
  })

  wss.on('connection', ws => {
    onConnection(ws)
    ws.on('message', data => {
      const payload = JSON.parse(data.toString())
      console.log('[receive] ' + payload.type, payload)
      onMessage(ws, payload)
    })
  })

  return wss
}

export function startServer(
  onConnection: (ws: WebSocket) => void,
  onMessage: (ws: WebSocket, payload: ClientPayload) => void
): http.Server {
  const server = startStaticServer()
  startWebSocketServer(server, onConnection, onMessage)

  return server
}
