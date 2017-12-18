export type ServerPayload = InitDocument
export type ClientPayload = {}

export interface InitDocument {
  type: 'init-document',
  template: string
  style: string
}