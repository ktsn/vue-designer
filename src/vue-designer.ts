import * as vscode from 'vscode'
import * as path from 'path'
import { AddressInfo } from 'net'
import { CommandEmitter, MessageBus, EventObserver } from 'meck'
import {
  startStaticServer,
  startWebSocketServer,
  wsEventObserver,
  wsCommandEmiter
} from './server/main'
import { VueFile } from './parser/vue-file'
import { Commands, Events } from './message/types'
import { observeServerEvents } from './message/bus'
import { AssetResolver } from './asset-resolver'

function createHighlight(): vscode.TextEditorDecorationType {
  return vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(200, 200, 200, 0.2)'
  })
}

function createVSCodeEventObserver(): EventObserver<Events> {
  const folders = vscode.workspace.workspaceFolders
  const pattern = folders && new vscode.RelativePattern(folders[0], '**/*.vue')
  const watcher = pattern && vscode.workspace.createFileSystemWatcher(pattern)

  const config = vscode.workspace.getConfiguration('vueDesigner')
  const sharedStylePaths = config.get<string[]>('sharedStyles') || []

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

    if (watcher) {
      watcher.onDidCreate(uri => {
        vscode.workspace.openTextDocument(uri).then(document => {
          emit('addDocument', {
            uri: uri.toString(),
            code: document.getText()
          })
        })
      })

      watcher.onDidChange(uri => {
        vscode.workspace.openTextDocument(uri).then(document => {
          emit('changeDocument', {
            uri: uri.toString(),
            code: document.getText()
          })
        })
      })

      watcher.onDidDelete(uri => {
        emit('removeDocument', uri.toString())
      })
    }

    vscode.workspace.findFiles('**/*.vue', '**/node_modules/**').then(uris => {
      uris.forEach(uri => {
        vscode.workspace.openTextDocument(uri).then(document => {
          emit('addDocument', {
            uri: uri.toString(),
            code: document.getText()
          })
        })
      })
    })

    if (folders) {
      const rootPath = folders[0].uri.fsPath

      Promise.all(
        sharedStylePaths.map(stylePath => {
          const fsStylePath = path.join(rootPath, stylePath)
          return vscode.workspace.openTextDocument(fsStylePath).then(doc => {
            return doc.getText()
          })
        })
      ).then(sharedStyles => {
        emit('loadSharedStyle', sharedStyles.join('\n'))
      })
    }
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
  const vueFiles: Record<string, VueFile> = {}
  const assetResolver = new AssetResolver()

  const previewUri = vscode.Uri.parse('vue-designer://authority/vue-designer')
  const server = startStaticServer(assetResolver)
  const wsServer = startWebSocketServer(server)

  const editor = vscode.window.activeTextEditor
  const activeUri = editor && editor.document.uri.toString()

  const bus = new MessageBus(
    [wsEventObserver(wsServer), createVSCodeEventObserver()],
    [wsCommandEmiter(wsServer), createVSCodeCommandEmitter()]
  )
  observeServerEvents(bus, assetResolver, vueFiles, activeUri)

  const serverPort = process.env.DEV
    ? 50000
    : (server.address() as AddressInfo).port
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

  context.subscriptions.push(disposable, registration, bus, {
    dispose: () => server.close()
  })
}
