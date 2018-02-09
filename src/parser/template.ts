import { AST } from 'vue-eslint-parser'
import { scopePrefix } from './style'

type RootElement = AST.VElement & AST.HasConcreteInfo
type ChildNode = AST.VElement | AST.VText | AST.VExpressionContainer

export function templateToPayload(body: RootElement, code: string): Template {
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
  child: ChildNode,
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

export function getNode(
  root: RootElement,
  path: number[]
): ChildNode | undefined {
  function loop(current: ChildNode, rest: number[]): ChildNode | undefined {
    // If `rest` does not have any items,
    // `current` is the node we are looking for.
    if (rest.length === 0) {
      return current
    }

    // The current node does not have children,
    // then we cannot traverse any more.
    if (current.type !== 'VElement') {
      return undefined
    }

    const next = current.children[rest[0]]
    if (!next) {
      return undefined
    } else {
      return loop(next, rest.slice(1))
    }
  }
  return loop(root, path)
}

export function visitElements(node: Template, fn: (el: Element) => void): void {
  function loop(node: ElementChild): void {
    switch (node.type) {
      case 'Element':
        fn(node)
        return node.children.forEach(loop)
      default: // Do nothing
    }
  }
  return node.children.forEach(loop)
}

export function addScope(node: Template, scope: string): void {
  visitElements(node, el => {
    el.attributes.push({
      type: 'Attribute',
      directive: false,
      index: -1,
      name: scopePrefix + scope,
      value: null
    })
  })
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
