import * as vscode from 'vscode'
import { startServer } from './server/main'
import { initDocument } from './server/communication'
import { parseVueFile, vueFileToPayload, VueFile } from './parser/vue-file'
import { getNode } from './parser/template'

export function activate(context: vscode.ExtensionContext) {
  const highlight = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(200, 200, 200, 0.2)'
  })
  let lastActiveTextEditor = vscode.window.activeTextEditor
  const vueFiles = new Map<string, VueFile>()

  vscode.window.onDidChangeActiveTextEditor(() => {
    const editor = vscode.window.activeTextEditor
    if (editor) {
      lastActiveTextEditor = editor
    }
  })

  initVueFilesWatcher(vueFiles)

  const previewUri = vscode.Uri.parse('vue-designer://authority/vue-designer')
  const server = startServer(
    ws => {
      console.log('Client connected')

      function initCurrentDocument(document: vscode.TextDocument): void {
        const uri = document.uri.toString()
        const parsed = vueFiles.get(uri)
        if (parsed) {
          const payload = vueFileToPayload(parsed)
          initDocument(ws, payload)
        }
      }

      if (lastActiveTextEditor) {
        initCurrentDocument(lastActiveTextEditor.document)
      }

      vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
          initCurrentDocument(editor.document)
        }
      })

      vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document === vscode.window.activeTextEditor!.document) {
          initCurrentDocument(event.document)
        }
      })
    },
    (_ws, payload) => {
      switch (payload.type) {
        case 'SelectNode':
          const vueFile = vueFiles.get(payload.uri)
          if (!vueFile || !vueFile.template) break

          const element = getNode(vueFile.template, payload.path)
          if (!element) {
            break
          }
          const styleRules = vueFile.matchSelector(
            vueFile.template,
            payload.path
          )

          const editor = vscode.window.visibleTextEditors.find(e => {
            return e.document.uri.toString() === vueFile!.uri
          })
          if (!editor) {
            break
          }

          const highlightList = [element, ...styleRules].map(node => {
            const start = editor.document.positionAt(node.range[0])
            const end = editor.document.positionAt(node.range[1])
            return new vscode.Range(start, end)
          })

          editor.setDecorations(highlight, highlightList)
          break
        default:
          throw new Error('Unexpected client payload: ' + payload.type)
      }
    }
  )

  const serverPort = process.env.DEV ? 50000 : server.address().port
  console.log(`Vue Designer server listening at http://localhost:${serverPort}`)

  class TextDocumentContentProvider
    implements vscode.TextDocumentContentProvider {
    public provideTextDocumentContent(): string {
      return `<style>
      html, body, iframe {
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
    'extension.showVueComponentPreview',
    () => {
      return vscode.commands
        .executeCommand(
          'vscode.previewHtml',
          previewUri,
          vscode.ViewColumn.Two,
          'Vue component preview'
        )
        .then(
          () => {},
          reason => {
            vscode.window.showErrorMessage(reason)
          }
        )
    }
  )

  context.subscriptions.push(disposable, registration, {
    dispose: () => server.close()
  })
}

function initVueFilesWatcher(store: Map<string, VueFile>): void {
  const watcher = vscode.workspace.createFileSystemWatcher('**/*.vue')

  function storeParsedVueFile(uri: vscode.Uri): void {
    vscode.workspace.openTextDocument(uri).then(document => {
      const uriStr = uri.toString()
      const code = document.getText()
      const parsed = parseVueFile(code, uriStr)
      store.set(uriStr, parsed)
    })
  }

  watcher.onDidCreate(storeParsedVueFile)
  watcher.onDidChange(storeParsedVueFile)
  watcher.onDidDelete(uri => {
    store.delete(uri.toString())
  })

  vscode.workspace.findFiles('**/*.vue', '**/node_modules/**').then(uris => {
    uris.forEach(storeParsedVueFile)
  })
}
