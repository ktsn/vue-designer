import { Template } from './parser/template'
import { Prop } from './parser/script'

export type ServerPayload = InitDocument
export type ClientPayload = {}

export interface InitDocument {
  type: 'InitDocument'
  template: Template | null
  props: Prop[]
  styles: string[]
}
