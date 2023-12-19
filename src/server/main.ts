import * as path from 'path'
import { promises as fs } from 'fs'
import * as http from 'http'
import WebSocket from 'ws'
import { AssetResolver } from '../asset-resolver'

function readContent(file: string): Promise<string> {
  return fs.readFile(path.join(__dirname, '..', file), 'utf8')
}

export function startStaticServer(assetResolver: AssetResolver): http.Server {
  const server = http.createServer((req, res) => {
    if (req.headers.host && !/^localhost(:\d+)?$/.test(req.headers.host)) {
      res.statusCode = 403
      res.end()
      return
    }

    if (req.url) {
      const assetPath = assetResolver.urlToPath(req.url)
      if (assetPath) {
        return fs
          .readFile(assetPath)
          .then((data) => {
            res.setHeader('Content-Type', inferMimeType(assetPath))
            res.end(data)
          })
          .catch((err) => {
            if (!err) {
              res.statusCode = 404
              res.end()
            } else {
              res.statusCode = 500
              res.end(err.message)
            }
          })
      }

      const filePath = req.url === '/' ? '/index.html' : req.url
      if (allowedPath(filePath)) {
        return readContent(filePath)
          .then((content) => {
            res.setHeader('Content-Type', inferMimeType(filePath))
            res.end(content)
          })
          .catch((err) => {
            if (!err) {
              res.statusCode = 404
              res.end()
            } else {
              res.statusCode = 500
              res.end(err.message)
            }
          })
      }
    }

    res.statusCode = 404
    res.end()
  })

  const port = process.env.DEV ? 50001 : 0
  server.listen(port)

  return server
}

function allowedPath(path: string): boolean {
  return path === '/index.html' || path.startsWith('/app/')
}

function inferMimeType(filePath: string): string {
  const ext = path.extname(filePath)
  switch (ext) {
    case '.html':
      return 'text/html'
    case '.css':
      return 'text/css'
    case '.js':
      return 'application/javascript'
    case '.png':
      return 'image/png'
    case '.jpg':
      return 'image/jpeg'
    case '.gif':
      return 'image/gif'
    case '.svg':
      return 'image/svg+xml'
    case '.woff':
      return 'font/woff'
    case '.woff2':
      return 'font/woff2'
    default:
      return 'application/octet-stream'
  }
}

export function startWebSocketServer(http: http.Server): WebSocket.Server {
  return new WebSocket.Server({
    host: 'localhost',
    server: http,
    path: '/api',
  })
}
