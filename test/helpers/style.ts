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

export function createStyle(children: (AtRule | Rule)[]): Style {
  modifyPath(children)
  return {
    path: [0],
    children,
    range: [-1, -1]
  }
}

function modifyPath(nodes: (AtRule | Rule | Declaration)[]): void {
  function loop(nodes: (AtRule | Rule | Declaration)[], path: number[]): void {
    nodes.forEach((node, i) => {
      const nextPath = path.concat(i)
      node.path = nextPath

      if (node.type !== 'Declaration') {
        loop(node.children, nextPath)
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
    before: '',
    after: '',
    name,
    params,
    children,
    range: [-1, -1]
  }
}

export function rule(
  selectors: Selector[],
  children: Declaration[] = []
): Rule {
  return {
    type: 'Rule',
    path: [],
    before: '',
    after: '',
    selectors,
    children,
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
  value?: string,
  insensitive: boolean = false
): Attribute {
  return {
    type: 'Attribute',
    name,
    operator,
    value,
    insensitive
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
    before: '',
    after: '',
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

export function assertStyleNode(result: Style, expected: Style): void {
  expect(exclude(result)).toEqual(exclude(expected))
}

function exclude(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(exclude)
  } else if (obj === null || typeof obj !== 'object') {
    return obj
  }

  const res: any = {}
  Object.keys(obj).forEach(key => {
    if (key !== 'range' && key !== 'before' && key !== 'after') {
      const value = obj[key]
      res[key] = exclude(value)
    }
  })
  return res
}
