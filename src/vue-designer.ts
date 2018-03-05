import * as vscode from 'vscode'
import { CommandEmitter, MessageBus, EventObserver } from 'meck'
import {
  startStaticServer,
  startWebSocketServer,
  wsEventObserver,
  wsCommandEmiter
} from './server/main'
import { parseVueFile, vueFileToPayload, VueFile } from './parser/vue-file'
import { mapValues } from './utils'
import { Commands, Events } from './message/types'
import { observeServerEvents } from './message/bus'

function createHighlight(): vscode.TextEditorDecorationType {
  return vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(200, 200, 200, 0.2)'
  })
}

function createVSCodeEventObserver(): EventObserver<Events> {
  return new EventObserver(emit => {
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) {
        emit('changeActiveEditor', editor.document.uri.toString())
      }
    })

    vscode.workspace.onDidChangeTextDocument(event => {
      if (event.document === vscode.window.activeTextEditor!.document) {
        const code = event.document.getText()
        const uri = event.document.uri.toString()
        emit('updateEditor', {
          uri,
          code
        })
      }
    })
  })
}

function createVSCodeCommandEmitter(): CommandEmitter<Commands> {
  let currentHighlight: vscode.TextEditorDecorationType | undefined

  return new CommandEmitter(observe => {
    observe('highlightEditor', ({ uri, ranges }) => {
      const editor = vscode.window.visibleTextEditors.find(e => {
        return e.document.uri.toString() === uri
      })

      if (!editor) {
        return
      }

      // Cancel previous highlight
      if (currentHighlight) {
        currentHighlight.dispose()
      }

      const highlightList = ranges.map(range => {
        const start = editor.document.positionAt(range[0])
        const end = editor.document.positionAt(range[1])
        return new vscode.Range(start, end)
      })

      currentHighlight = createHighlight()
      editor.setDecorations(currentHighlight, highlightList)
    })

    observe('updateEditor', ({ uri, code }) => {
      const parsedUri = vscode.Uri.parse(uri)
      vscode.workspace.openTextDocument(parsedUri).then(doc => {
        const range = new vscode.Range(
          doc.positionAt(0),
          doc.positionAt(doc.getText().length)
        )

        const wsEdit = new vscode.WorkspaceEdit()
        wsEdit.replace(parsedUri, range, code)
        vscode.workspace.applyEdit(wsEdit)
      })
    })
  })
}

export function activate(context: vscode.ExtensionContext) {
  let lastActiveTextEditor = vscode.window.activeTextEditor
  const vueFiles: Record<string, VueFile> = {}

  vscode.window.onDidChangeActiveTextEditor(() => {
    const editor = vscode.window.activeTextEditor
    if (editor) {
      lastActiveTextEditor = editor
    }
  })

  const fsWatcher = initVueFilesWatcher(vueFiles)

  const previewUri = vscode.Uri.parse('vue-designer://authority/vue-designer')
  const server = startStaticServer()
  const wsServer = startWebSocketServer(server)

  const bus = new MessageBus(
    [wsEventObserver(wsServer), createVSCodeEventObserver()],
    [wsCommandEmiter(wsServer), createVSCodeCommandEmitter()]
  )
  observeServerEvents(bus, vueFiles)

  wsServer.on('connection', () => {
    console.log('Client connected')

    bus.emit('initProject', mapValues(vueFiles, vueFileToPayload))
    fsWatcher.onDidChange(() => {
      bus.emit('initProject', mapValues(vueFiles, vueFileToPayload))
    })

    if (lastActiveTextEditor) {
      bus.emit('changeDocument', lastActiveTextEditor.document.uri.toString())
    }
  })

  const serverPort = process.env.DEV ? 50000 : server.address().port
  console.log(`Vue Designer server listening at http://localhost:${serverPort}`)

  class TextDocumentContentProvider
    implements vscode.TextDocumentContentProvider {
    public provideTextDocumentContent(): string {
      return `<style>
      html, body, iframe {
        overflow: hidden;
        margin: 0;
        padding: 0;
        height: 100%;
        width: 100%;
        border-width: 0;
        background-color: #fff;
      }
      </style>
      <body>
        <iframe src="http://localhost:${serverPort}"></iframe>
      </body>`
    }
  }

  const provider = new TextDocumentContentProvider()
  const registration = vscode.workspace.registerTextDocumentContentProvider(
    'vue-designer',
    provider
  )

  const disposable = vscode.commands.registerCommand(
    'extension.openVueDesigner',
    () => {
      return vscode.commands
        .executeCommand(
          'vscode.previewHtml',
          previewUri,
          vscode.ViewColumn.Two,
          'Vue Designer'
        )
        .then(
          () => {},
          reason => {
            vscode.window.showErrorMessage(reason)
          }
        )
    }
  )

  context.subscriptions.push(fsWatcher, disposable, registration, bus, {
    dispose: () => server.close()
  })
}

function initVueFilesWatcher(
  store: Record<string, VueFile>
): vscode.FileSystemWatcher {
  const watcher = vscode.workspace.createFileSystemWatcher('**/*.vue')

  function storeParsedVueFile(uri: vscode.Uri): void {
    vscode.workspace.openTextDocument(uri).then(document => {
      const uriStr = uri.toString()
      const code = document.getText()
      const parsed = parseVueFile(code, uriStr)
      store[uriStr] = parsed
    })
  }

  watcher.onDidCreate(storeParsedVueFile)
  watcher.onDidChange(storeParsedVueFile)
  watcher.onDidDelete(uri => {
    delete store[uri.toString()]
  })

  vscode.workspace.findFiles('**/*.vue', '**/node_modules/**').then(uris => {
    uris.forEach(storeParsedVueFile)
  })

  return watcher
}
