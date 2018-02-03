import { VueFilePayload } from './parser/vue-file'

export type ServerPayload = InitDocument
export type ClientPayload = {}

export interface InitDocument {
  type: 'InitDocument'
  vueFile: VueFilePayload
}
