import { VueFilePayload } from './parser/vue-file'

export type ServerPayload = InitDocument
export type ClientPayload = SelectNode

export interface InitDocument {
  type: 'InitDocument'
  vueFile: VueFilePayload
}

export interface SelectNode {
  type: 'SelectNode'
  uri: string
  path: number[]
}
