import * as path from 'path'
import * as fs from 'fs'
import * as http from 'http'

const js = fs.readFileSync(path.resolve(__dirname, '../vue-designer-view.js'), 'utf8')

const html = `<html>
<body>
  <div id="app"></div>
  <script src="/vue-designer-view.js"></script>
</body>
</html>`

export function startStaticServer(): http.Server {
  const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      res.write(html)
    } else if (req.url === '/vue-designer-view.js') {
      res.write(js)
    } else {
      res.statusCode = 404
    }
    res.end()
  })

  server.listen()

  return server
}
