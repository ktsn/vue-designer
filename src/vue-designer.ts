import * as vscode from 'vscode'
import * as path from 'path'
import { AddressInfo } from 'net'
import debounce from 'lodash.debounce'
import { startStaticServer, startWebSocketServer } from './server/main'
import { AssetResolver } from './asset-resolver'
import { Watcher } from './vscode/watcher'
import { applyModifiers } from './vscode/modifier'
import { VueFileRepository } from './repositories/vue-file-repository'
import { SettingRepository } from './repositories/setting-repository'
import { EditorRepository } from './repositories/editor-repository'
import {
  vueFileToPayload as _vueFileToPayload,
  VueFile,
} from './parser/vue-file'
import { Subject } from './infra/communication/subject'
import { connectWsServer } from './infra/communication/connect'
import { enableLogging } from './infra/communication/logger'
import { mutator } from './server/mutator'
import { resolver } from './server/resolver'
import { SubjectType } from './server/subject-type'

function createVSCodeWatcher(
  rootPath: string,
  setting: SettingRepository,
): Watcher {
  return new Watcher(rootPath, setting.sharedStylePaths)
}

function createSettingRepository(rootPath: string): SettingRepository {
  const config = vscode.workspace.getConfiguration('vueDesigner')

  const repo = new SettingRepository(config as any, {
    async readFile(filePath) {
      const uri = vscode.Uri.file(path.join(rootPath, filePath))
      const document = await vscode.workspace.openTextDocument(uri)
      return document.getText()
    },
  })

  return repo
}

async function createVueFileRepository(): Promise<VueFileRepository> {
  const uris = (
    await vscode.workspace.findFiles('**/*.vue', '**/node_modules/**')
  ).map((uri) => uri.toString())

  const repo = await VueFileRepository.create(uris, {
    async readFile(rawUri) {
      const uri = vscode.Uri.parse(rawUri)
      const document = await vscode.workspace.openTextDocument(uri)
      return document.getText()
    },

    modifyFile(uri, modifiers) {
      return applyModifiers(uri, modifiers)
    },
  })

  return repo
}

function createEditorRepository(vueFiles: VueFileRepository): EditorRepository {
  const activeEditor = vscode.window.activeTextEditor
  const activeDocumentUrl = activeEditor && activeEditor.document.uri.toString()

  return new EditorRepository(activeDocumentUrl, vueFiles, {
    highlight(uri, ranges) {
      const editor = vscode.window.visibleTextEditors.find((e) => {
        return e.document.uri.toString() === uri
      })

      if (!editor) {
        return
      }

      const highlightList = ranges.map((range) => {
        const start = editor.document.positionAt(range[0])
        const end = editor.document.positionAt(range[1])
        return new vscode.Range(start, end)
      })

      const currentHighlight = createHighlight()
      editor.setDecorations(currentHighlight, highlightList)

      return currentHighlight
    },
  })
}

function createHighlight(): vscode.TextEditorDecorationType {
  return vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(200, 200, 200, 0.2)',
  })
}

function connectToSubject(
  subject: Subject<SubjectType>,
  watcher: Watcher,
  assetResolver: AssetResolver,
  vueFiles: VueFileRepository,
  setting: SettingRepository,
  editor: EditorRepository,
): void {
  const vueFileToPayload = (vueFile: VueFile) => {
    return _vueFileToPayload(vueFile, assetResolver)
  }

  const notifySaveVueFileByUri = async (uri: vscode.Uri) => {
    const vueFile = await vueFiles.read(uri.toString())
    subject.notify('saveDocument', {
      vueFile: vueFileToPayload(vueFile),
    })
  }

  vueFiles.on('update', (vueFile) => {
    subject.notify('saveDocument', {
      vueFile: vueFileToPayload(vueFile),
    })
  })

  // Since editing component will be happened in high frequency
  // we need to debounce the notification to avoid high load.
  watcher.onDidEditComponent(debounce(notifySaveVueFileByUri, 200))

  watcher.onDidCreateComponent(notifySaveVueFileByUri)
  watcher.onDidChangeComponent(notifySaveVueFileByUri)

  watcher.onDidDeleteComponent((uri) => {
    const uriStr = uri.toString()
    vueFiles.delete(uriStr)
    subject.notify('removeDocument', { uri: uriStr })
  })

  watcher.onDidChangeSharedStyle(async () => {
    subject.notify('initSharedStyle', {
      style: await setting.readSharedStyle(),
    })
  })

  watcher.onDidSwitchComponent((uri) => {
    editor.activeDocumentUrl = uri.toString()
    subject.notify('changeActiveDocument', { uri: editor.activeDocumentUrl })
  })
}

function getWebViewContent(port: number): string {
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
    <iframe src="http://localhost:${port}" sandbox="allow-scripts"></iframe>
  </body>`
}

export async function activate(context: vscode.ExtensionContext) {
  const folders = vscode.workspace.workspaceFolders
  const rootFolder = folders && folders[0].uri.fsPath
  if (!rootFolder) return

  const setting = createSettingRepository(rootFolder)
  const watcher = createVSCodeWatcher(rootFolder, setting)
  const vueFiles = await createVueFileRepository()
  const editor = createEditorRepository(vueFiles)
  const assetResolver = new AssetResolver()

  const server = startStaticServer(assetResolver)
  const wsServer = enableLogging(startWebSocketServer(server))
  const subject = new Subject<SubjectType>(wsServer)

  connectWsServer({
    resolver: resolver(vueFiles, setting, editor, assetResolver),
    mutator: mutator(vueFiles, editor),
    server: wsServer,
  })

  connectToSubject(subject, watcher, assetResolver, vueFiles, setting, editor)

  const serverPort = process.env.DEV
    ? 50000
    : (server.address() as AddressInfo).port
  console.log(`Vue Designer server listening at http://localhost:${serverPort}`)

  const disposable = vscode.commands.registerCommand(
    'extension.openVueDesigner',
    () => {
      const panel = vscode.window.createWebviewPanel(
        'vueDesigner',
        'Vue Designer',
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
        },
      )

      panel.webview.html = getWebViewContent(serverPort)
    },
  )

  context.subscriptions.push(
    disposable,
    {
      dispose: () => server.close(),
    },
    {
      dispose: () => watcher.destroy(),
    },
    {
      dispose: () => vueFiles.destroy(),
    },
  )
}
