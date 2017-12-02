import * as vscode from 'vscode'
import { startServer, disposeServer } from './server/main'
import { parseComponent } from 'vue-template-compiler'

export function activate(context: vscode.ExtensionContext) {
  const previewUri = vscode.Uri.parse('vue-designer://authority/vue-designer');
  const server = startServer()

  console.log(`Vue Designer server listening at http://localhost:${server.htmlServer.port}`)

  class TextDocumentContentProvider implements vscode.TextDocumentContentProvider {
    public provideTextDocumentContent(uri: vscode.Uri): string {
      return this.createVueSnippet();
    }

    public update(uri: vscode.Uri) {
      let editor = vscode.window.activeTextEditor!;
      let text = editor.document.getText();

      const { template, styles } = parseComponent(text)
    }

    private createVueSnippet() {
      let editor = vscode.window.activeTextEditor!;
      if (editor.document.languageId !== 'vue') {
        return this.errorSnippet("Active editor doesn't show a Vue document - no properties to preview.")
      }
      return this.extractSnippet();
    }

    private extractSnippet(): string {
      return this.snippet();
    }

    private errorSnippet(error: string): string {
      return `
        <body>
          ${error}
        </body>`;
    }

    private snippet(): string {
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
          <iframe src="http://localhost:${server.staticServer.address().port}"></iframe>
        </body>`;
    }
  }

  let provider = new TextDocumentContentProvider();
  let registration = vscode.workspace.registerTextDocumentContentProvider('vue-designer', provider);

  vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
    if (e.document === vscode.window.activeTextEditor!.document) {
      provider.update(previewUri);
    }
  });

  vscode.window.onDidChangeTextEditorSelection((e: vscode.TextEditorSelectionChangeEvent) => {
    if (e.textEditor === vscode.window.activeTextEditor) {
      provider.update(previewUri);
    }
  })

  let disposable = vscode.commands.registerCommand('extension.showVueComponentPreview', () => {
    return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two, 'Vue component preview').then((success) => {
    }, (reason) => {
      vscode.window.showErrorMessage(reason);
    });
  });

  context.subscriptions.push(disposable, registration, { dispose: () => disposeServer(server) });
}
