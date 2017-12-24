import { Template } from './parser/template'

export type ServerPayload = InitDocument
export type ClientPayload = {}

export interface InitDocument {
  type: 'InitDocument',
  template: Template | null
  styles: string[]
}
