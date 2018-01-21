import { AST } from 'vue-eslint-parser'

export function templateToPayload(
  body: AST.VElement & AST.HasConcreteInfo,
  code: string
): Template {
  return {
    type: 'Template',
    attributes: body.startTag.attributes
      .filter(attr => !attr.directive)
      .map((attr, i) => {
        const a = attr as AST.VAttribute
        return attribute(i, a.key.name, a.value && a.value.value)
      }),
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
    el.startTag.attributes.map((attr, i) => transformAttribute(attr, i, code)),
    el.children.map((child, i) => transformChild(child, code, path.concat(i)))
  )
}

function transformAttribute(
  attr: AST.VAttribute | AST.VDirective,
  index: number,
  code: string
): Attribute | Directive {
  if (attr.directive) {
    const exp = attr.value && attr.value.expression
    const expStr = exp ? extractExpression(exp, code) : null
    return directive(
      index,
      attr.key.name,
      attr.key.argument,
      attr.key.modifiers,
      expStr,
      exp && evalExpression(exp)
    )
  } else {
    return attribute(index, attr.key.name, attr.value && attr.value.value)
  }
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
      return expressionNode(path, exp ? extractExpression(exp, code) : '')
  }
}

function extractExpression(node: AST.HasLocation, code: string): string {
  return code.slice(node.range[0], node.range[1])
}

function evalExpression(
  exp: AST.ESLintExpression | AST.VForExpression | AST.VOnExpression
): ExpressionValue {
  switch (exp.type) {
    case 'Literal':
      return exp.value
    default:
      return undefined
  }
}

export type ExpressionValue =
  | string
  | boolean
  | number
  | RegExp
  | null
  | undefined

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
  attributes: (Attribute | Directive)[]
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
  directive: false
  index: number
  name: string
  value: string | null
}

export interface Directive {
  type: 'Attribute'
  directive: true
  index: number
  name: string
  argument: string | null
  modifiers: string[]
  expression: string | null
  value?: any
}

export function element(
  path: number[],
  name: string,
  attributes: (Attribute | Directive)[],
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
    directive: false,
    index,
    name,
    value
  }
}

export function directive(
  index: number,
  name: string,
  argument: string | null,
  modifiers: string[],
  expression: string | null,
  value: ExpressionValue
): Directive {
  return {
    type: 'Attribute',
    directive: true,
    index,
    name,
    argument,
    modifiers,
    expression,
    value
  }
}
