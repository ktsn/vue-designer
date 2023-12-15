import * as vscode from 'vscode'
import * as path from 'path'

export class Watcher extends vscode.Disposable {
  private sharedStyleUris: vscode.Uri[]
  private innerWatcher: vscode.FileSystemWatcher

  constructor(rootPath: string, sharedStyleUris: string[]) {
    super(() => {
      this.innerWatcher.dispose()
    })

    this.sharedStyleUris = sharedStyleUris.map((stylePath) => {
      return vscode.Uri.file(path.join(rootPath, stylePath))
    })

    const pattern = new vscode.RelativePattern(rootPath, '**/*.{vue,css}')
    this.innerWatcher = vscode.workspace.createFileSystemWatcher(pattern)
  }

  onDidSwitchComponent(fn: (uri: vscode.Uri) => void): void {
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && path.extname(editor.document.uri.fsPath) === '.vue') {
        fn(editor.document.uri)
      }
    })
  }

  onDidEditComponent(
    fn: (uri: vscode.Uri, doc: vscode.TextDocument) => void
  ): void {
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document !== vscode.window.activeTextEditor!.document) {
        return
      }
      const uri = event.document.uri
      this.createVueListener(fn)(uri)
    })
  }

  onDidCreateComponent(
    fn: (uri: vscode.Uri, doc: vscode.TextDocument) => void
  ): void {
    this.innerWatcher.onDidCreate(this.createVueListener(fn))
  }

  onDidChangeComponent(
    fn: (uri: vscode.Uri, doc: vscode.TextDocument) => void
  ): void {
    this.innerWatcher.onDidChange(this.createVueListener(fn))
  }

  onDidDeleteComponent(fn: (uri: vscode.Uri) => void): void {
    this.innerWatcher.onDidDelete(fn)
  }

  onDidChangeSharedStyle(fn: () => void): void {
    const uris = this.sharedStyleUris.map((uri) => uri.toString())

    const interpolate = (uri: vscode.Uri): void => {
      if (uris.indexOf(uri.toString()) >= 0) {
        fn()
      }
    }

    const w = this.innerWatcher
    w.onDidCreate(interpolate)
    w.onDidChange(interpolate)
    w.onDidDelete(interpolate)
  }

  destroy(): void {
    this.innerWatcher.dispose()
  }

  private createVueListener(
    fn: (uri: vscode.Uri, doc: vscode.TextDocument) => void
  ): (uri: vscode.Uri) => void {
    return (uri) => {
      if (path.extname(uri.fsPath) !== '.vue') {
        return
      }
      vscode.workspace.openTextDocument(uri).then((doc) => {
        fn(uri, doc)
      })
    }
  }
}
