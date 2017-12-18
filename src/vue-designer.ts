import * as vscode from 'vscode'
import { startServer } from './server/main'
import { parseComponent } from 'vue-template-compiler'
import { initDocument } from './server/communication';

export function activate(context: vscode.ExtensionContext) {
  let lastActiveTextEditor = vscode.window.activeTextEditor
  vscode.window.onDidChangeActiveTextEditor(e => {
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
        const { template, styles } = parseComponent(lastActiveTextEditor.document.getText())
        initDocument(ws, template.content, styles.map((s: any) => s.content).join('\n'))
      }

      vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
        if (e.document === vscode.window.activeTextEditor!.document) {
          const { template, styles } = parseComponent(e.document.getText())
          initDocument(ws, template.content, styles.map((s: any) => s.content).join('\n'))
        }
      })
    },
    () => {}
  )

  const serverPort = server.address().port
  console.log(`Vue Designer server listening at http://localhost:${serverPort}`)

  class TextDocumentContentProvider implements vscode.TextDocumentContentProvider {
    public provideTextDocumentContent(uri: vscode.Uri): string {
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
      </body>`;
    }
  }

  const provider = new TextDocumentContentProvider();
  const registration = vscode.workspace.registerTextDocumentContentProvider('vue-designer', provider);

  const disposable = vscode.commands.registerCommand('extension.showVueComponentPreview', () => {
    return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two, 'Vue component preview').then((success) => {
    }, (reason) => {
      vscode.window.showErrorMessage(reason);
    });
  });

  context.subscriptions.push(disposable, registration, { dispose: () => server.close() });
}
