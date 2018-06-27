import { Template } from '@/parser/template/types'
import { Prop, Data, ChildComponent } from '@/parser/script/types'

export interface ScopedDocument {
  uri: string
  displayName: string
  template: Template | undefined
  props: Prop[]
  data: Data[]
  childComponents: ChildComponent[]
  styleCode: string
}

export interface DocumentScopeItem {
  type: string | null
  value: any
}

export interface DocumentScope {
  props: Record<string, DocumentScopeItem>
  data: Record<string, DocumentScopeItem>
}

export type DraggingPlace = 'before' | 'after' | 'first' | 'last'
