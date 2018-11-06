import { VueFileRepository } from './repositories/vue-file-repository'
import { EditorRepository } from './repositories/editor-repository'
import {
  STDeclarationForAdd,
  STDeclarationForUpdate
} from './parser/style/types'

interface SelectNodePayload {
  uri: string
  templatePath: number[]
  stylePaths: number[][]
}

interface AddNodePayload {
  uri: string
  insertNodeUri: string
  path: number[]
}

interface AddDeclarationPayload {
  uri: string
  declaration: STDeclarationForAdd
  path: number[]
}

interface RemoveDeclarationPayload {
  uri: string
  path: number[]
}

interface UpdateDeclarationPayload {
  uri: string
  declaration: STDeclarationForUpdate
}

export const mutator = (
  vueFiles: VueFileRepository,
  editor: EditorRepository
) => ({
  selectNode({ uri, templatePath, stylePaths }: SelectNodePayload): void {
    editor.selectNode(uri, templatePath, stylePaths)
  },

  addNode({ uri, insertNodeUri, path }: AddNodePayload): void {
    vueFiles.addTemplateNode(uri, insertNodeUri, path)
  },

  addDeclaration({ uri, declaration, path }: AddDeclarationPayload): void {
    vueFiles.addStyleDeclaration(uri, declaration, path)
  },

  removeDeclaration({ uri, path }: RemoveDeclarationPayload): void {
    vueFiles.removeStyleDeclaration(uri, path)
  },

  updateDeclaration({ uri, declaration }: UpdateDeclarationPayload): void {
    vueFiles.updateStyleDeclaration(uri, declaration)
  }
})

export type MutatorType = ReturnType<typeof mutator>
