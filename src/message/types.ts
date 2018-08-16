import {
  STDeclarationForUpdate,
  STDeclarationForAdd
} from '../parser/style/types'
import { VueFilePayload } from '../parser/vue-file'

export interface Events {
  initClient: undefined
  loadSharedStyle: string
  selectNode: {
    uri: string
    templatePath: number[]
    stylePaths: number[][]
  }
  addNode: {
    currentUri: string
    nodeUri: string
    path: number[]
  }
  changeActiveEditor: string
  updateEditor: {
    uri: string
    code: string
  }
  addDocument: {
    uri: string
    code: string
  }
  changeDocument: {
    uri: string
    code: string
  }
  removeDocument: string
  addDeclaration: {
    uri: string
    path: number[]
    declaration: STDeclarationForAdd
  }
  removeDeclaration: {
    uri: string
    path: number[]
  }
  updateDeclaration: {
    uri: string
    declaration: STDeclarationForUpdate
  }
}

export interface Commands {
  initProject: Record<string, VueFilePayload>
  initSharedStyle: string
  changeDocument: string
  highlightEditor: {
    uri: string
    ranges: [number, number][]
  }
  updateEditor: {
    uri: string
    code: string
  }
}
