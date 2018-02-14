import { AST } from 'vue-eslint-parser'
import { scopePrefix } from './style'

type RootElement = AST.VElement & AST.HasConcreteInfo
type ChildNode = AST.VElement | AST.VText | AST.VExpressionContainer

export function transformTemplate(body: RootElement, code: string): Template {
  return {
    type: 'Template',
    range: body.range,
    attributes: body.startTag.attributes
      .filter(attr => !attr.directive)
      .map((attr, i) => {
        const a = attr as AST.VAttribute
        return attribute(i, a.key.name, a.value && a.value.value, attr.range)
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
    el.children.map((child, i) => transformChild(child, code, path.concat(i))),
    el.range
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
      attr.range
    )
  } else {
    return attribute(
      index,
      attr.key.name,
      attr.value && attr.value.value,
      attr.range
    )
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
      return textNode(path, child.value, child.range)
    case 'VExpressionContainer':
      const exp = child.expression
      return expressionNode(
        path,
        exp ? extractExpression(exp, code) : '',
        child.range
      )
  }
}

function extractExpression(node: AST.HasLocation, code: string): string {
  return code.slice(node.range[0], node.range[1])
}

export function getNode(
  root: Template,
  path: number[]
): ElementChild | undefined {
  function loop(
    current: ElementChild,
    rest: number[]
  ): ElementChild | undefined {
    // If `rest` does not have any items,
    // `current` is the node we are looking for.
    if (rest.length === 0) {
      return current
    }

    // The current node does not have children,
    // then we cannot traverse any more.
    if (current.type !== 'Element') {
      return undefined
    }

    const next = current.children[rest[0]]
    if (!next) {
      return undefined
    } else {
      return loop(next, rest.slice(1))
    }
  }
  const [index, ...rest] = path
  const el = root.children[index]
  return el && loop(el, rest)
}

export function visitElements(
  node: Template,
  fn: (el: Element) => Element | void
): Template {
  function loop(node: ElementChild): ElementChild {
    switch (node.type) {
      case 'Element':
        const newNode = {
          ...node,
          children: node.children.map(loop)
        }
        return fn(newNode) || newNode
      default:
        // Do nothing
        return node
    }
  }
  return {
    ...node,
    children: node.children.map(loop)
  }
}

export function addScope(node: Template, scope: string): Template {
  return visitElements(node, el => {
    return {
      ...el,
      attributes: el.attributes.concat({
        type: 'Attribute',
        directive: false,
        index: -1,
        name: scopePrefix + scope,
        value: null,
        range: [-1, -1]
      })
    }
  })
}

export type ElementChild = Element | TextNode | ExpressionNode

interface BaseNode {
  type: string
  range: [number, number]
}

export interface Template extends BaseNode {
  type: 'Template'
  attributes: Attribute[]
  children: ElementChild[]
}

export interface Element extends BaseNode {
  type: 'Element'
  path: number[]
  name: string
  attributes: (Attribute | Directive)[]
  children: ElementChild[]
}

export interface TextNode extends BaseNode {
  type: 'TextNode'
  path: number[]
  text: string
}

export interface ExpressionNode extends BaseNode {
  type: 'ExpressionNode'
  path: number[]
  expression: string
}

export interface Attribute extends BaseNode {
  type: 'Attribute'
  directive: false
  index: number
  name: string
  value: string | null
}

export interface Directive extends BaseNode {
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
  children: ElementChild[],
  range: [number, number]
): Element {
  return {
    type: 'Element',
    path,
    name,
    attributes,
    children,
    range
  }
}

export function textNode(
  path: number[],
  text: string,
  range: [number, number]
): TextNode {
  return {
    type: 'TextNode',
    path,
    text,
    range
  }
}

export function expressionNode(
  path: number[],
  expression: string,
  range: [number, number]
): ExpressionNode {
  return {
    type: 'ExpressionNode',
    path,
    expression,
    range
  }
}

export function attribute(
  index: number,
  name: string,
  value: string | null,
  range: [number, number]
): Attribute {
  return {
    type: 'Attribute',
    directive: false,
    index,
    name,
    value,
    range
  }
}

export function directive(
  index: number,
  name: string,
  argument: string | null,
  modifiers: string[],
  expression: string | null,
  range: [number, number]
): Directive {
  return {
    type: 'Attribute',
    directive: true,
    index,
    name,
    argument,
    modifiers,
    expression,
    range
  }
}
