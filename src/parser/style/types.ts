import { Range } from '../modifier'

export interface HasChildren<T extends STChild> {
  children: T[]
}

export interface STStyle extends Range, HasChildren<STAtRule | STRule> {
  path: [number]
}

export interface STRule extends Range, HasChildren<STDeclaration> {
  type: 'Rule'
  before: string
  after: string
  path: number[]
  selectors: STSelector[]
}

export interface STDeclaration extends Range {
  type: 'Declaration'
  before: string
  after: string
  path: number[]
  prop: string
  value: string
  important: boolean
}

export interface STAtRule extends Range, HasChildren<STChild> {
  type: 'AtRule'
  before: string
  after: string
  path: number[]
  name: string
  params: string
}

export type STChild = STAtRule | STRule | STDeclaration

export interface STSelector {
  type: 'Selector'
  universal: boolean
  tag?: string
  id?: string
  class: string[]
  attributes: STAttribute[]
  pseudoClass: STPseudoClass[]
  pseudoElement?: STPseudoElement
  leftCombinator?: STCombinator
}

export interface STPseudoClass {
  type: 'PseudoClass'
  value: string
  params: STSelector[]
}

export interface STPseudoElement {
  type: 'PseudoElement'
  value: string
  pseudoClass: STPseudoClass[]
}

export type STAttributeOperator = '=' | '~=' | '|=' | '^=' | '$=' | '*='

export interface STAttribute {
  type: 'Attribute'
  operator?: STAttributeOperator
  name: string
  value?: string
  insensitive: boolean
}

export interface STCombinator {
  type: 'Combinator'
  operator: string
  left: STSelector
}

/*
 * Used to print in the preview
 */
export interface STRuleForPrint {
  path: number[]
  selectors: string[]
  children: STDeclarationForPrint[]
}

export interface STDeclarationForPrint {
  path: number[]
  prop: string
  value: string
}

/**
 * Used to update ast
 */
export interface STDeclarationForAdd {
  prop: string
  value: string
  important: boolean
}

export interface STDeclarationForUpdate {
  path: number[]
  prop?: string
  value?: string
  important?: boolean
}
