import assert from 'assert'
import * as path from 'path'
import * as fs from 'fs'
import * as http from 'http'
import WebSocket from 'ws'
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
