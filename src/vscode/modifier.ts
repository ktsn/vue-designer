import * as vscode from 'vscode'
import { Modifiers, reduce } from '../parser/modifier'

export async function applyModifiers(
  uri: string,
  modifiers: Modifiers,
): Promise<void> {
  const parsedUri = vscode.Uri.parse(uri)
  const doc = await vscode.workspace.openTextDocument(parsedUri)

  const wsEdit = reduce(
    modifiers,
    (edit, m) => {
      switch (m.type) {
        case 'Add':
          edit.insert(parsedUri, doc.positionAt(m.pos), m.value)
          break
        case 'Remove':
          edit.delete(
            parsedUri,
            new vscode.Range(
              doc.positionAt(m.pos),
              doc.positionAt(m.pos + m.length),
            ),
          )
          break
        default:
      }
      return edit
    },
    new vscode.WorkspaceEdit(),
  )

  await vscode.workspace.applyEdit(wsEdit)
}
