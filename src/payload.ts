import { VueFilePayload } from './parser/vue-file'
import { DeclarationForUpdate } from './parser/style/types'

export type ServerPayload = InitProject | ChangeDocument
export type ClientPayload = SelectNode | AddNode | UpdateDeclaration

export interface InitProject {
  type: 'InitProject'
  vueFiles: Record<string, VueFilePayload>
}

export interface ChangeDocument {
  type: 'ChangeDocument'
  uri: string
}

export interface SelectNode {
  type: 'SelectNode'
  uri: string
  templatePath: number[]
  stylePaths: number[][]
}

export interface AddNode {
  type: 'AddNode'
  currentUri: string
  nodeUri: string
  path: number[]
}

export interface UpdateDeclaration {
  type: 'UpdateDeclaration'
  uri: string
  declaration: DeclarationForUpdate
}
