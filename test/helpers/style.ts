import { AttributeOperator } from 'postcss-selector-parser'
import {
  STStyle,
  STDeclaration,
  STRule,
  STCombinator,
  STSelector,
  STAtRule,
  STPseudoClass,
  STPseudoElement,
  STAttribute,
  STChild
} from '@/parser/style/types'

export function createStyle(children: (STAtRule | STRule)[]): STStyle {
  modifyPath(children)
  return {
    path: [0],
    children,
    range: [-1, -1]
  }
}

function modifyPath(nodes: (STAtRule | STRule | STDeclaration)[]): void {
  function loop(
    nodes: (STAtRule | STRule | STDeclaration)[],
    path: number[]
  ): void {
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
  children: STChild[] = []
): STAtRule {
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
  selectors: STSelector[],
  children: STDeclaration[] = []
): STRule {
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
  options: Partial<STSelector>,
  next?: STCombinator
): STSelector {
  const s: STSelector = {
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
): STAttribute {
  return {
    type: 'Attribute',
    name,
    operator,
    value,
    insensitive
  }
}

export function combinator(operator: string, next: STSelector): STCombinator {
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
): STDeclaration {
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

export function pClass(
  value: string,
  params: STSelector[] = []
): STPseudoClass {
  return {
    type: 'PseudoClass',
    value,
    params
  }
}

export function pElement(
  value: string,
  pseudoClass: STPseudoClass[] = []
): STPseudoElement {
  return {
    type: 'PseudoElement',
    value,
    pseudoClass
  }
}

export function assertStyleNode(result: STStyle, expected: STStyle): void {
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
