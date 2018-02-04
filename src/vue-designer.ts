import * as vscode from 'vscode'
import { startServer } from './server/main'
import { initDocument } from './server/communication'
import { parseVueFile, VueFile } from './parser/vue-file'
import { getNode } from './parser/template'

export function activate(context: vscode.ExtensionContext) {
  const highlight = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(200, 200, 200, 0.35)'
  })
  let lastActiveTextEditor = vscode.window.activeTextEditor
  let vueFile: VueFile | undefined

  vscode.window.onDidChangeActiveTextEditor(() => {
    const editor = vscode.window.activeTextEditor
    if (editor) {
      lastActiveTextEditor = editor
    }
  })

  const previewUri = vscode.Uri.parse('vue-designer://authority/vue-designer')
  const server = startServer(
    ws => {
      console.log('Client connected')

      function initCurrentDocument(document: vscode.TextDocument): void {
        const code = document.getText()
        const uri = document.uri.toString()
        const parsed = parseVueFile(code, uri)
        vueFile = parsed.vueFile
        initDocument(ws, parsed.payload)
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
          if (!vueFile || !vueFile.template) break

          const target = getNode(vueFile.template, payload.path)
          if (!target) break

          for (const editor of vscode.window.visibleTextEditors) {
            const doc = editor.document
            if (doc.uri.toString() === vueFile.uri.toString()) {
              const start = doc.positionAt(target.range[0])
              const end = doc.positionAt(target.range[1])

              editor.setDecorations(highlight, [new vscode.Range(start, end)])
            }
          }
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
