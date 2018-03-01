import { AST } from 'vue-eslint-parser'
import * as t from './types'

type RootElement = AST.VElement & AST.HasConcreteInfo
type ChildNode = AST.VElement | AST.VText | AST.VExpressionContainer

export function transformTemplate(body: RootElement, code: string): t.Template {
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
): t.Element {
  const attrs = el.startTag.attributes

  const start = startTag(
    attrs.map((attr, i) => transformAttribute(attr, i, code)),
    el.startTag.selfClosing,
    el.startTag.range
  )

  const end = el.endTag && endtag(el.endTag.range)

  return element(
    path,
    el.name,
    start,
    end,
    el.children.map((child, i) => transformChild(child, code, path.concat(i))),
    el.range
  )
}

function transformAttribute(
  attr: AST.VAttribute | AST.VDirective,
  index: number,
  code: string
): t.Attribute | t.Directive {
  if (attr.directive) {
    if (attr.key.name === 'for') {
      return transformVForDirective(attr, index, code)
    } else {
      return transformDirective(attr, index, code)
    }
  } else {
    return attribute(
      index,
      attr.key.name,
      attr.value && attr.value.value,
      attr.range
    )
  }
}

function transformDirective(
  node: AST.VDirective,
  index: number,
  code: string
): t.Directive {
  const exp = node.value && node.value.expression
  const expStr = exp ? extractExpression(exp, code) : null
  return directive(
    index,
    node.key.name,
    node.key.argument,
    node.key.modifiers,
    expStr,
    node.range
  )
}

function transformVForDirective(
  node: AST.VDirective,
  index: number,
  code: string
): t.VForDirective {
  const exp =
    node.value &&
    node.value.expression &&
    node.value.expression.type === 'VForExpression'
      ? node.value.expression
      : null

  return vForDirective(
    index,
    exp ? exp.left.map(l => extractExpression(l, code)) : [],
    exp && extractExpression(exp.right, code),
    node.range
  )
}

function transformChild(
  child: ChildNode,
  code: string,
  path: number[]
): t.ElementChild {
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

function element(
  path: number[],
  name: string,
  startTag: t.StartTag,
  endTag: t.EndTag | null,
  children: t.ElementChild[],
  range: [number, number]
): t.Element {
  return {
    type: 'Element',
    path,
    name,
    startTag,
    endTag,
    children,
    range
  }
}

function startTag(
  attributes: (t.Attribute | t.Directive)[],
  selfClosing: boolean,
  range: [number, number]
): t.StartTag {
  return {
    type: 'StartTag',
    attributes,
    selfClosing,
    range
  }
}

function endtag(range: [number, number]): t.EndTag {
  return {
    type: 'EndTag',
    range
  }
}

function textNode(
  path: number[],
  text: string,
  range: [number, number]
): t.TextNode {
  return {
    type: 'TextNode',
    path,
    text,
    range
  }
}

function expressionNode(
  path: number[],
  expression: string,
  range: [number, number]
): t.ExpressionNode {
  return {
    type: 'ExpressionNode',
    path,
    expression,
    range
  }
}

function attribute(
  index: number,
  name: string,
  value: string | null,
  range: [number, number]
): t.Attribute {
  return {
    type: 'Attribute',
    directive: false,
    index,
    name,
    value,
    range
  }
}

function directive(
  index: number,
  name: string,
  argument: string | null,
  modifiers: string[],
  expression: string | null,
  range: [number, number]
): t.Directive {
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

function vForDirective(
  index: number,
  left: string[],
  right: string | null,
  range: [number, number]
): t.VForDirective {
  return {
    type: 'Attribute',
    directive: true,
    index,
    name: 'for',
    argument: null,
    modifiers: [],
    expression: null,
    left,
    right,
    range
  }
}
