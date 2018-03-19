import { Range } from '../modifier'

export interface Style extends Range {
  path: [number]
  body: (AtRule | Rule)[]
}

export interface Rule extends Range {
  type: 'Rule'
  before: string
  after: string
  path: number[]
  selectors: Selector[]
  declarations: Declaration[]
}

export interface Declaration extends Range {
  type: 'Declaration'
  before: string
  after: string
  path: number[]
  prop: string
  value: string
  important: boolean
}

export interface AtRule extends Range {
  type: 'AtRule'
  before: string
  after: string
  path: number[]
  name: string
  params: string
  children: ChildNode[]
}

export type ChildNode = AtRule | Rule | Declaration

export interface Selector {
  type: 'Selector'
  universal: boolean
  tag?: string
  id?: string
  class: string[]
  attributes: Attribute[]
  pseudoClass: PseudoClass[]
  pseudoElement?: PseudoElement
  leftCombinator?: Combinator
}

export interface PseudoClass {
  type: 'PseudoClass'
  value: string
  params: Selector[]
}

export interface PseudoElement {
  type: 'PseudoElement'
  value: string
  pseudoClass: PseudoClass[]
}

export type AttributeOperator = '=' | '~=' | '|=' | '^=' | '$=' | '*='

export interface Attribute {
  type: 'Attribute'
  operator?: AttributeOperator
  name: string
  value?: string
}

export interface Combinator {
  type: 'Combinator'
  operator: string
  left: Selector
}

/*
 * Used to print in the preview
 */
export interface RuleForPrint {
  path: number[]
  selectors: string[]
  declarations: DeclarationForPrint[]
}

export interface DeclarationForPrint {
  path: number[]
  prop: string
  value: string
}

/**
 * Used to update ast
 */
export interface DeclarationForAdd {
  prop: string
  value: string
  important: boolean
}

export interface DeclarationForUpdate {
  path: number[]
  prop?: string
  value?: string
  important?: boolean
}
