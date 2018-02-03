import * as vscode from 'vscode'
import { startServer } from './server/main'
import { initDocument } from './server/communication'
import { parseComponent } from 'vue-template-compiler'
import * as parser from 'vue-eslint-parser'
import { templateToPayload } from './parser/template'
import { extractProps, extractData } from './parser/script'
import { VueFilePayload } from './parser/vue-file'

export function activate(context: vscode.ExtensionContext) {
  let lastActiveTextEditor = vscode.window.activeTextEditor
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
      if (lastActiveTextEditor) {
        const vueFile = parseCode(lastActiveTextEditor.document.getText())
        initDocument(ws, vueFile)
      }

      vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
          const vueFile = parseCode(editor.document.getText())
          initDocument(ws, vueFile)
        }
      })

      vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document === vscode.window.activeTextEditor!.document) {
          const vueFile = parseCode(event.document.getText())
          initDocument(ws, vueFile)
        }
      })
    },
    () => {}
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

function parseCode(code: string): VueFilePayload {
  const { styles } = parseComponent(code)
  const program = parser.parse(code, { sourceType: 'module' })
  const template = program.templateBody
    ? templateToPayload(program.templateBody, code)
    : undefined
  const props = extractProps(program.body)
  const data = extractData(program.body)
  return {
    template,
    props,
    data,
    styles: styles.map((s: any) => s.content)
  }
}
