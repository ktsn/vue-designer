export type ServerPayload = InitDocument
export type ClientPayload = {}

export interface InitDocument {
  type: 'InitDocument',
  template: Template | null
  styles: string[]
}

export type ElementChild = Element | TextNode | ExpressionNode

export interface Template {
  type: 'Template'
  attributes: Attribute[]
  children: ElementChild[]
}

export interface Element {
  type: 'Element'
  path: number[]
  name: string
  attributes: Attribute[]
  children: ElementChild[]
}

export interface TextNode {
  type: 'TextNode'
  path: number[]
  text: string
}

export interface ExpressionNode {
  type: 'ExpressionNode'
  path: number[]
  expression: string
}

export interface Attribute {
  type: 'Attribute'
  index: number
  name: string
  value: string | null
}

export function element(path: number[], name: string, attributes: Attribute[], children: ElementChild[]): Element {
  return {
    type: 'Element',
    path,
    name,
    attributes,
    children
  }
}

export function textNode(path: number[], text: string): TextNode {
  return {
    type: 'TextNode',
    path,
    text
  }
}

export function expressionNode(path: number[], expression: string): ExpressionNode {
  return {
    type: 'ExpressionNode',
    path,
    expression
  }
}

export function attribute(index: number, name: string, value: string | null): Attribute {
  return {
    type: 'Attribute',
    index,
    name,
    value
  }
}
