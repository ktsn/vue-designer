import * as vscode from 'vscode'
import { startServer } from './server/main'
import { initProject, changeDocument, matchRules } from './server/communication'
import {
  parseVueFile,
  vueFileToPayload,
  VueFile,
  resolveImportPath
} from './parser/vue-file'
import { getNode } from './parser/template'
import { mapValues } from './utils'
import {
  modify,
  insertToTemplate,
  insertComponentScript,
  Modifiers
} from './parser/modifier'
import { transformRuleForPrint } from './parser/style'

function createHighlight(): vscode.TextEditorDecorationType {
  return vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(200, 200, 200, 0.2)'
  })
}

export function activate(context: vscode.ExtensionContext) {
  let currentHighlight: vscode.TextEditorDecorationType | undefined
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
  const server = startServer(
    ws => {
      console.log('Client connected')

      function initCurrentDocument(document: vscode.TextDocument): void {
        const code = document.getText()
        const uri = document.uri.toString()
        vueFiles[uri] = parseVueFile(code, uri)
        initProject(ws, mapValues(vueFiles, vueFileToPayload))
      }

      initProject(ws, mapValues(vueFiles, vueFileToPayload))
      fsWatcher.onDidChange(() => {
        initProject(ws, mapValues(vueFiles, vueFileToPayload))
      })

      if (lastActiveTextEditor) {
        changeDocument(ws, lastActiveTextEditor.document.uri.toString())
      }

      vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
          changeDocument(ws, editor.document.uri.toString())
        }
      })

      vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document === vscode.window.activeTextEditor!.document) {
          initCurrentDocument(event.document)
        }
      })
    },
    (ws, payload) => {
      switch (payload.type) {
        case 'SelectNode': {
          // Cancel highlight
          if (currentHighlight) {
            currentHighlight.dispose()
          }

          const vueFile = vueFiles[payload.uri]
          if (!vueFile || !vueFile.template || payload.path.length === 0) {
            break
          }

          const element = getNode(vueFile.template, payload.path)
          if (!element) {
            break
          }
          const styleRules = vueFile.matchSelector(
            vueFile.template,
            payload.path
          )

          const editor = vscode.window.visibleTextEditors.find(e => {
            return e.document.uri.toString() === vueFile!.uri.toString()
          })
          if (!editor) break

          const highlightList = [element, ...styleRules].map(node => {
            const start = editor.document.positionAt(node.range[0])
            const end = editor.document.positionAt(node.range[1])
            return new vscode.Range(start, end)
          })

          currentHighlight = createHighlight()
          editor.setDecorations(currentHighlight, highlightList)

          // Notify matched rules to client
          matchRules(ws, styleRules.map(transformRuleForPrint))
          break
        }
        case 'AddNode': {
          const vueFile = vueFiles[payload.currentUri]
          if (!vueFile || !vueFile.template) break

          const component = vueFiles[payload.nodeUri]
          if (!component) break

          const existingComponent = vueFile.childComponents.find(child => {
            return child.uri === component.uri.toString()
          })

          const uriStr = vueFile.uri.toString()
          const uri = vscode.Uri.parse(uriStr)
          vscode.workspace.openTextDocument(uri).then(doc => {
            const code = doc.getText()
            const componentName = existingComponent
              ? existingComponent.name
              : component.name

            const modifier: Modifiers = [
              insertToTemplate(
                vueFile.template!,
                payload.path,
                `<${componentName} />`
              )
            ]

            if (!existingComponent) {
              modifier.push(
                insertComponentScript(
                  vueFile.script,
                  code,
                  componentName,
                  resolveImportPath(vueFile, component)
                )
              )
            }

            const updated = modify(code, modifier)

            const range = new vscode.Range(
              doc.positionAt(0),
              doc.positionAt(code.length)
            )

            const wsEdit = new vscode.WorkspaceEdit()
            wsEdit.replace(uri, range, updated)
            vscode.workspace.applyEdit(wsEdit)

            vueFiles[uriStr] = parseVueFile(updated, uriStr)
            initProject(ws, mapValues(vueFiles, vueFileToPayload))
          })
          break
        }
        default:
          throw new Error('Unexpected client payload: ' + (payload as any).type)
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

  context.subscriptions.push(fsWatcher, disposable, registration, {
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
