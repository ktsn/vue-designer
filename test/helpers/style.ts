import { AttributeOperator } from 'postcss-selector-parser'
import {
  Style,
  Declaration,
  Rule,
  Combinator,
  Selector,
  AtRule,
  PseudoClass,
  PseudoElement,
  Attribute,
  ChildNode
} from '@/parser/style/types'

export function createStyle(body: (AtRule | Rule)[]): Style {
  modifyPath(body)
  return {
    path: [0],
    body,
    range: [-1, -1]
  }
}

function modifyPath(nodes: (AtRule | Rule | Declaration)[]): void {
  function loop(nodes: (AtRule | Rule | Declaration)[], path: number[]): void {
    nodes.forEach((node, i) => {
      const nextPath = path.concat(i)
      node.path = nextPath
      if (node.type === 'AtRule') {
        loop(node.children, nextPath)
      } else if (node.type === 'Rule') {
        loop(node.declarations, nextPath)
      }
    })
  }
  loop(nodes, [0])
}

export function atRule(
  name: string,
  params: string,
  children: ChildNode[] = []
): AtRule {
  return {
    type: 'AtRule',
    path: [],
    name,
    params,
    children,
    range: [-1, -1]
  }
}

export function rule(
  selectors: Selector[],
  declarations: Declaration[] = []
): Rule {
  return {
    type: 'Rule',
    path: [],
    selectors,
    declarations,
    range: [-1, -1]
  }
}

export function selector(
  options: Partial<Selector>,
  next?: Combinator
): Selector {
  const s: Selector = {
    type: 'Selector',
    universal: options.universal || false,
    class: options.class || [],
    attributes: options.attributes || [],
    pseudoClass: options.pseudoClass || []
  }

  if (options.tag) {
    s.tag = options.tag
  }

  if (options.id) {
    s.id = options.id
  }

  if (options.pseudoElement) {
    s.pseudoElement = options.pseudoElement
  }

  if (next) {
    s.leftCombinator = next
  }

  return s
}

export function attribute(
  name: string,
  operator?: AttributeOperator,
  value?: string
): Attribute {
  return {
    type: 'Attribute',
    name,
    operator,
    value
  }
}

export function combinator(operator: string, next: Selector): Combinator {
  return {
    type: 'Combinator',
    operator,
    left: next
  }
}

export function declaration(
  prop: string,
  value: string,
  important: boolean = false
): Declaration {
  return {
    type: 'Declaration',
    path: [],
    prop,
    value,
    important,
    range: [-1, -1]
  }
}

export function pClass(value: string, params: Selector[] = []): PseudoClass {
  return {
    type: 'PseudoClass',
    value,
    params
  }
}

export function pElement(
  value: string,
  pseudoClass: PseudoClass[] = []
): PseudoElement {
  return {
    type: 'PseudoElement',
    value,
    pseudoClass
  }
}

export function assertWithoutRange(result: Style, expected: Style): void {
  expect(excludeRange(result)).toEqual(excludeRange(expected))
}

function excludeRange(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(excludeRange)
  } else if (obj === null || typeof obj !== 'object') {
    return obj
  }

  const res: any = {}
  Object.keys(obj).forEach(key => {
    if (key !== 'range') {
      const value = obj[key]
      res[key] = excludeRange(value)
    }
  })
  return res
}
