import * as vscode from 'vscode'
import * as path from 'path'

export class Watcher extends vscode.Disposable {
  private sharedStyleUris: vscode.Uri[]
  private innerWatcher: vscode.FileSystemWatcher

  constructor(rootPath: string) {
    super(() => {
      this.innerWatcher.dispose()
    })

    const config = vscode.workspace.getConfiguration('vueDesigner')

    this.sharedStyleUris = (config.get<string[]>('sharedStyles') || []).map(
      stylePath => {
        return vscode.Uri.file(path.join(rootPath, stylePath))
      }
    )

    const pattern = new vscode.RelativePattern(rootPath, '**/*.{vue,css}')
    this.innerWatcher = vscode.workspace.createFileSystemWatcher(pattern)
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

  onDidChangeSharedStyle(fn: (style: string) => void): void {
    const uris = this.sharedStyleUris.map(uri => uri.toString())

    const interpolate = (uri: vscode.Uri): void => {
      if (uris.indexOf(uri.toString()) < 0) {
        return
      }

      Promise.all(
        this.sharedStyleUris.map(uri => {
          return vscode.workspace
            .openTextDocument(uri)
            .then(doc => doc.getText(), () => '')
        })
      ).then(styles => {
        fn(styles.join('\n'))
      })
    }

    const w = this.innerWatcher
    w.onDidCreate(interpolate)
    w.onDidChange(interpolate)
    w.onDidDelete(interpolate)
  }

  private createVueListener(
    fn: (uri: vscode.Uri, doc: vscode.TextDocument) => void
  ): (uri: vscode.Uri) => void {
    return uri => {
      if (path.extname(uri.fsPath) !== '.vue') {
        return
      }
      vscode.workspace.openTextDocument(uri).then(doc => {
        fn(uri, doc)
      })
    }
  }
}
