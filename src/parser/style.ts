import * as postcss from 'postcss'
import parseSelector from 'postcss-selector-parser'
import * as selectorParser from 'postcss-selector-parser'

export function transformStyle(root: postcss.Root): Style {
  if (!root.nodes) {
    return { body: [] }
  }
  const body = root.nodes
    .map(node => {
      switch (node.type) {
        case 'atrule':
          return transformAtRule(node)
        case 'rule':
          return transformRule(node)
        default:
          return undefined
      }
    })
    .filter((node): node is AtRule | Rule => {
      return node !== undefined
    })

  return { body }
}

function transformAtRule(atRule: postcss.AtRule): AtRule {
  return {
    type: 'AtRule',
    name: atRule.name,
    params: atRule.params,
    children: []
  }
}

function transformRule(rule: postcss.Rule): Rule {
  const decls = rule.nodes ? rule.nodes.filter(isDeclaration) : []
  const root = parseSelector().astSync(rule.selector)

  return {
    type: 'Rule',
    selectors: root.nodes.map(n => {
      // A child of root node is always selector
      const selectors = (n as selectorParser.Selector).nodes
      return transformSelector(selectors)
    }),
    declarations: decls.map(transformDeclaration)
  }
}

function transformSelector(selector: selectorParser.Node[]): Selector {
  return {
    type: 'Selector',
    last: transformSelectorElements(selector)
  }
}

function transformSelectorElements(
  nodes: selectorParser.Node[]
): SelectorElement {
  function loop(
    current: SelectorElement,
    el: selectorParser.Node | undefined,
    rest: selectorParser.Node[]
  ): SelectorElement {
    if (!el) {
      return current
    }

    switch (el.type) {
      case 'combinator':
        const next = emptySelectorElement()
        next.leftCombinator = transformCombinator(el, current)
        return loop(next, rest[0], rest.slice(1))
      case 'tag':
        current.tag = el.value
        break
      case 'id':
        current.id = el.value
        break
      case 'pseudo':
        current.pseudo = el.value
        break
      case 'class':
        current.class.push(el.value)
        break
      case 'universal':
        current.universal = true
        break
      case 'attribute':
        current.attributes.push(transformAttribute(el))
        break
      default:
    }
    return loop(current, rest[0], rest.slice(1))
  }

  const [first, ...tail] = nodes
  return loop(emptySelectorElement(), first, tail)
}

function transformAttribute(attr: selectorParser.Attribute): Attribute {
  return {
    type: 'Attribute',
    operator: attr.operator,
    name: attr.attribute,
    value: attr.value
  }
}

function transformCombinator(
  comb: selectorParser.Combinator,
  left: SelectorElement
): Combinator {
  return {
    type: 'Combinator',
    value: comb.value,
    left
  }
}

function transformDeclaration(decl: postcss.Declaration): Declaration {
  return {
    type: 'Declaration',
    prop: decl.prop,
    value: decl.value,
    important: decl.important || false // decl.import is possibly undefined
  }
}

function transformChild(child: postcss.ChildNode): ChildNode {}

function emptySelectorElement(): SelectorElement {
  return {
    type: 'SelectorElement',
    universal: false,
    class: [],
    attributes: []
  }
}

function isDeclaration(node: postcss.Node): node is postcss.Declaration {
  return node.type === 'decl'
}

export interface Style {
  body: (AtRule | Rule)[]
}

export interface Rule {
  type: 'Rule'
  selectors: Selector[]
  declarations: Declaration[]
}

export interface Declaration {
  type: 'Declaration'
  prop: string
  value: string
  important: boolean
}

export interface AtRule {
  type: 'AtRule'
  name: string
  params: string
  children: ChildNode[]
}

export type ChildNode = AtRule | Rule | Declaration

export interface Selector {
  type: 'Selector'
  last: SelectorElement
}

export interface SelectorElement {
  type: 'SelectorElement'
  universal: boolean
  tag?: string
  id?: string
  class: string[]
  attributes: Attribute[]
  pseudo?: string
  leftCombinator?: Combinator
}

export interface Attribute {
  type: 'Attribute'
  operator?: selectorParser.AttributeOperator
  name: string
  value?: string
}

export interface Combinator {
  type: 'Combinator'
  value: string
  left: SelectorElement
}
