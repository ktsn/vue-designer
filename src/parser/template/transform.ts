import { AST } from 'vue-eslint-parser'
import * as t from './types'

type RootElement = AST.VElement & AST.HasConcreteInfo
type ChildNode = AST.VElement | AST.VText | AST.VExpressionContainer

export function transformTemplate(body: RootElement, code: string): t.Template {
  const transformed = body.startTag.attributes.map((attr, index) =>
    transformAttribute(attr, index, code)
  )
  const attrs = extractAttrs(transformed)
  return {
    type: 'Template',
    range: body.range,
    attrs,
    children: body.children.map((child, i) => transformChild(child, code, [i]))
  }
}

function transformElement(
  el: AST.VElement,
  code: string,
  path: number[]
): t.Element {
  const attrs = el.startTag.attributes.map((attr, index) =>
    transformAttribute(attr, index, code)
  )

  const start = startTag(
    extractAttrs(attrs),
    extractProps(attrs),
    extractDomProps(attrs),
    extractDirectives(attrs),
    el.startTag.selfClosing,
    el.startTag.range
  )

  const end = el.endTag && endtag(el.endTag.range)

  return element(
    path,
    el.name,
    start,
    end || undefined,
    el.children.map((child, i) => transformChild(child, code, path.concat(i))),
    el.range
  )
}

function extractAttrs(
  attrs: (t.Attribute | t.Directive)[]
): Record<string, t.Attribute> {
  const res: Record<string, t.Attribute> = {}

  attrs.forEach(attr => {
    if (attr.type === 'Attribute') {
      res[attr.name] = attr
    }
  })

  return res
}

function extractProps(
  attrs: (t.Attribute | t.Directive)[]
): Record<string, t.Directive> {
  const res: Record<string, t.Directive> = {}

  attrs.forEach(attr => {
    if (isProp(attr)) {
      res[attr.argument!] = attr
    }
  })

  return res
}

function extractDomProps(
  attrs: (t.Attribute | t.Directive)[]
): Record<string, t.Directive> {
  const res: Record<string, t.Directive> = {}

  attrs.forEach(attr => {
    if (isDomProp(attr)) {
      res[attr.argument!] = attr
    }
  })

  return res
}

function extractDirectives(
  attrs: (t.Attribute | t.Directive)[]
): t.Directive[] {
  return attrs.filter(
    (attr): attr is t.Directive => {
      return attr.type === 'Directive' && !isProp(attr) && !isDomProp(attr)
    }
  )
}

function transformAttribute(
  attr: AST.VAttribute | AST.VDirective,
  index: number,
  code: string
): t.Attribute | t.Directive {
  if (attr.directive) {
    if (attr.key.name === 'for') {
      const exp =
        attr.value &&
        attr.value.expression &&
        attr.value.expression.type === 'VForExpression'
          ? attr.value.expression
          : null

      return vForDirective(
        index,
        exp ? exp.left.map(l => extractExpression(l, code)) : [],
        exp ? extractExpression(exp.right, code) : undefined,
        attr.range
      )
    } else {
      const exp = attr.value && attr.value.expression
      const expStr = exp ? extractExpression(exp, code) : undefined
      return directive(
        index,
        attr.key.name,
        attr.key.argument || undefined,
        attr.key.modifiers,
        expStr,
        attr.range
      )
    }
  } else {
    return attribute(
      index,
      attr.key.name,
      attr.value ? attr.value.value : undefined,
      attr.range
    )
  }
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

function isProp(attr: t.Attribute | t.Directive): attr is t.Directive {
  return (
    attr.type === 'Directive' &&
    attr.name === 'bind' &&
    !attr.modifiers.prop &&
    attr.argument !== undefined
  )
}

function isDomProp(attr: t.Attribute | t.Directive): attr is t.Directive {
  return (
    attr.type === 'Directive' &&
    attr.name === 'bind' &&
    attr.modifiers.prop &&
    attr.argument !== undefined
  )
}

function element(
  path: number[],
  name: string,
  startTag: t.StartTag,
  endTag: t.EndTag | undefined,
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
  attrs: Record<string, t.Attribute>,
  props: Record<string, t.Directive>,
  domProps: Record<string, t.Directive>,
  directives: t.Directive[],
  selfClosing: boolean,
  range: [number, number]
): t.StartTag {
  return {
    type: 'StartTag',
    attrs,
    props,
    domProps,
    directives,
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
  attrIndex: number,
  name: string,
  value: string | undefined,
  range: [number, number]
): t.Attribute {
  return {
    type: 'Attribute',
    attrIndex,
    name,
    value,
    range
  }
}

function directive(
  attrIndex: number,
  name: string,
  argument: string | undefined,
  modifiers: string[],
  expression: string | undefined,
  range: [number, number]
): t.Directive {
  const mod: Record<string, boolean> = {}
  modifiers.forEach(m => {
    mod[m] = true
  })
  return {
    type: 'Directive',
    attrIndex,
    name,
    argument,
    modifiers: mod,
    expression,
    range
  }
}

function vForDirective(
  attrIndex: number,
  left: string[],
  right: string | undefined,
  range: [number, number]
): t.VForDirective {
  return {
    type: 'Directive',
    attrIndex,
    name: 'for',
    modifiers: {},
    left,
    right,
    range
  }
}
