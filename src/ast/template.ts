import { AST } from 'vue-eslint-parser'
import { Element, element, Attribute, attribute, TextNode, ExpressionNode, textNode, expressionNode } from '../payload';

export function templateToPayload(body: AST.VElement, code: string): Element {
  return transformElement(body, code, [0])
}

function transformElement(el: AST.VElement, code: string, path: number[]): Element {
  return element(
    path,
    el.name,
    el.startTag.attributes
      .filter(attr => !attr.directive)
      .map((attr, i) => transformAttribute(attr as AST.VAttribute, i)),
    el.children
      .map((child, i) => transformChild(child, code, path.concat(i)))
  )
}

function transformAttribute(attr: AST.VAttribute, index: number): Attribute {
  return attribute(index, attr.key.name, attr.value && attr.value.value)
}

function transformChild(child: AST.VElement | AST.VText | AST.VExpressionContainer, code: string, path: number[]): Element | TextNode | ExpressionNode {
  switch (child.type) {
    case 'VElement':
      return transformElement(child, code, path)
    case 'VText':
      return textNode(path, child.value)
    case 'VExpressionContainer':
      return expressionNode(path, code.slice(child.range[0], child.range[1]))
  }
}
