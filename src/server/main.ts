import assert from 'assert'
import * as path from 'path'
import * as fs from 'fs'
import * as http from 'http'
import WebSocket from 'ws'
import { EventObserver, CommandEmitter } from 'meck'
import { ClientPayload, ServerPayload } from '../payload'
import { Events, Commands } from '../message/types'
import { AssetResolver } from '../asset-resolver'

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

export function startStaticServer(assetResolver: AssetResolver): http.Server {
  const server = http.createServer((req, res) => {
    if (req.headers.host && !/^localhost(:\d+)?$/.test(req.headers.host)) {
      res.statusCode = 403
      res.end()
      return
    }

    if (req.url) {
      if (req.url === '/' || req.url === '/index.html') {
        res.end(html)
        return
      }

      const assetPath = assetResolver.urlToPath(req.url)
      if (assetPath) {
        fs.readFile(assetPath, (err, data) => {
          if (err) {
            res.statusCode = 500
            res.end(err.message)
            return
          }
          res.end(data)
        })
        return
      }

      if (allowedUrls.indexOf(req.url) >= 0) {
        readContent(req.url, (err, content) => {
          assert(!err, 'Unexpectedly file not found')
          res.end(content)
        })
        return
      }
    }

    res.statusCode = 404
    res.end()
  })

  const port = process.env.DEV ? 50001 : 0
  server.listen(port)

  return server
}

export function startWebSocketServer(http: http.Server): WebSocket.Server {
  return new WebSocket.Server({
    host: 'localhost',
    server: http,
    path: '/api'
  })
}

export function wsEventObserver(
  server: WebSocket.Server
): EventObserver<Events> {
  return new EventObserver(emit => {
    server.on('connection', ws => {
      console.log('Client connected')
      emit('initClient', undefined)

      ws.on('message', data => {
        const payload: ClientPayload = JSON.parse(data.toString())
        console.log('[receive] ' + payload.type, payload)

        switch (payload.type) {
          case 'SelectNode':
            return emit('selectNode', payload)
          case 'AddNode':
            return emit('addNode', payload)
          case 'AddDeclaration':
            return emit('addDeclaration', payload)
          case 'RemoveDeclaration':
            return emit('removeDeclaration', payload)
          case 'UpdateDeclaration':
            return emit('updateDeclaration', payload)
          default:
            throw new Error(
              'Unexpected client payload: ' + (payload as any).type
            )
        }
      })

      ws.on('error', err => {
        // To avoid clashing extension by ECONNRESET error...
        // https://github.com/websockets/ws/issues/1256
        if ((err as any).code === 'ECONNRESET') return
        throw err
      })
    })
  })
}

export function wsCommandEmiter(
  server: WebSocket.Server
): CommandEmitter<Commands> {
  function send(payload: ServerPayload): void {
    console.log('[send] ' + payload.type, payload)
    server.clients.forEach(ws => {
      ws.send(JSON.stringify(payload))
    })
  }

  return new CommandEmitter(observe => {
    observe('initProject', payload => {
      send({ type: 'InitProject', vueFiles: payload })
    })

    observe('initSharedStyle', payload => {
      send({ type: 'InitSharedStyle', style: payload })
    })

    observe('changeDocument', payload => {
      send({ type: 'ChangeDocument', uri: payload })
    })
  })
}
