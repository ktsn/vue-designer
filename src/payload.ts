export type ServerPayload = InitDocument
export type ClientPayload = {}

export interface InitDocument {
  type: 'init-document',
  template: Element | undefined
  styles: string[]
}

export interface Element {
  type: 'Element'
  path: number[]
  name: string
  attributes: Attribute[]
  children: (Element | TextNode | ExpressionNode)[]
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

export function element(path: number[], name: string, attributes: Attribute[], children: (Element | TextNode | ExpressionNode)[]): Element {
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
