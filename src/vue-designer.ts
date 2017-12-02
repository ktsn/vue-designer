import * as vscode from 'vscode'
import { parseComponent } from 'vue-template-compiler'
import { createView, View } from './view/main';

let vueDesignerView: View

export function activate(context: vscode.ExtensionContext) {
  vueDesignerView = createView()

  let previewUri = vscode.Uri.parse('vue-designer://authority/vue-designer');

  class TextDocumentContentProvider implements vscode.TextDocumentContentProvider {
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

    public provideTextDocumentContent(uri: vscode.Uri): string {
      return this.createVueSnippet();
    }

    get onDidChange(): vscode.Event<vscode.Uri> {
      return this._onDidChange.event;
    }

    public update(uri: vscode.Uri) {
      this._onDidChange.fire(uri);
    }

    private createVueSnippet() {
      let editor = vscode.window.activeTextEditor!;
      if (editor.document.languageId !== 'vue') {
        return this.errorSnippet("Active editor doesn't show a Vue document - no properties to preview.")
      }
      return this.extractSnippet();
    }

    private extractSnippet(): string {
      let editor = vscode.window.activeTextEditor!;
      let text = editor.document.getText();
      const { template, styles } = parseComponent(text)

      return this.snippet(template, styles);
    }

    private errorSnippet(error: string): string {
      return `
        <body>
          ${error}
        </body>`;
    }

    private snippet(template: any, styles: any): string {
      return `<style>
        ${styles.map((s: any) => s.content).join('\n')}
        </style>
        <body>
          <div id="app">
            ${template.content}
          </div>
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

  context.subscriptions.push(disposable, registration);
}
