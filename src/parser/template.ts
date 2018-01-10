import { AST } from 'vue-eslint-parser'

export function templateToPayload(
  body: AST.VElement & AST.HasConcreteInfo,
  code: string
): Template {
  return {
    type: 'Template',
    attributes: body.startTag.attributes
      .filter(attr => !attr.directive)
      .map((attr, i) => transformAttribute(attr as AST.VAttribute, i)),
    children: body.children.map((child, i) => transformChild(child, code, [i]))
  }
}

function transformElement(
  el: AST.VElement,
  code: string,
  path: number[]
): Element {
  return element(
    path,
    el.name,
    el.startTag.attributes
      .filter(attr => !attr.directive)
      .map((attr, i) => transformAttribute(attr as AST.VAttribute, i)),
    el.children.map((child, i) => transformChild(child, code, path.concat(i)))
  )
}

function transformAttribute(attr: AST.VAttribute, index: number): Attribute {
  return attribute(index, attr.key.name, attr.value && attr.value.value)
}

function transformChild(
  child: AST.VElement | AST.VText | AST.VExpressionContainer,
  code: string,
  path: number[]
): ElementChild {
  switch (child.type) {
    case 'VElement':
      return transformElement(child, code, path)
    case 'VText':
      return textNode(path, child.value)
    case 'VExpressionContainer':
      const exp = child.expression
      return expressionNode(
        path,
        exp ? code.slice(exp.range[0], exp.range[1]) : ''
      )
  }
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

export function element(
  path: number[],
  name: string,
  attributes: Attribute[],
  children: ElementChild[]
): Element {
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

export function expressionNode(
  path: number[],
  expression: string
): ExpressionNode {
  return {
    type: 'ExpressionNode',
    path,
    expression
  }
}

export function attribute(
  index: number,
  name: string,
  value: string | null
): Attribute {
  return {
    type: 'Attribute',
    index,
    name,
    value
  }
}
