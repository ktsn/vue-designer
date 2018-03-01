import { VueFilePayload } from './parser/vue-file'
import { RuleForPrint } from './parser/style/types'

export type ServerPayload = InitProject | ChangeDocument | MatchRules
export type ClientPayload = SelectNode | AddNode

export interface InitProject {
  type: 'InitProject'
  vueFiles: Record<string, VueFilePayload>
}

export interface ChangeDocument {
  type: 'ChangeDocument'
  uri: string
}

export interface MatchRules {
  type: 'MatchRules'
  rules: RuleForPrint[]
}

export interface SelectNode {
  type: 'SelectNode'
  uri: string
  path: number[]
}

export interface AddNode {
  type: 'AddNode'
  currentUri: string
  nodeUri: string
  path: number[]
}
