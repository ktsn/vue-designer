import assert from 'assert'
import postcss from 'postcss'
import selectorParser from 'postcss-selector-parser'

export const scopePrefix = 'data-scope-'

export function transformStyle(root: postcss.Root): Style {
  if (!root.nodes) {
    return { body: [] }
  }
  const body = root.nodes
    .map((node, i) => {
      switch (node.type) {
        case 'atrule':
          return transformAtRule(node, [i])
        case 'rule':
          return transformRule(node, [i])
        default:
          return undefined
      }
    })
    .filter((node): node is AtRule | Rule => {
      return node !== undefined
    })

  return { body }
}

function transformAtRule(atRule: postcss.AtRule, path: number[]): AtRule {
  const isNotComment = <T extends postcss.Node>(
    node: T | postcss.Comment
  ): node is T => {
    return node.type !== 'comment'
  }

  const children = atRule.nodes ? atRule.nodes.filter(isNotComment) : []

  return {
    type: 'AtRule',
    path,
    name: atRule.name,
    params: atRule.params,
    children: children.map((child, i) => {
      return transformChild(child, path.concat(i))
    })
  }
}

function transformRule(rule: postcss.Rule, path: number[]): Rule {
  const decls = rule.nodes ? rule.nodes.filter(isDeclaration) : []
  const root = selectorParser().astSync(rule.selector)

  return {
    type: 'Rule',
    path,
    selectors: root.nodes.map(n => {
      // A child of root node is always selector
      const selectors = (n as selectorParser.Selector).nodes
      return transformSelector(selectors)
    }),
    declarations: decls.map((decl, i) => {
      return transformDeclaration(decl, path.concat(i))
    })
  }
}

function transformSelector(nodes: selectorParser.Node[]): Selector {
  const [first, ...tail] = nodes
  return transformSelectorElement(emptySelector(), first, tail)
}

function transformSelectorElement(
  current: Selector,
  el: selectorParser.Node | undefined,
  rest: selectorParser.Node[]
): Selector {
  if (!el) {
    return current
  }

  const [first, ...tail] = rest
  switch (el.type) {
    case 'combinator':
      const next = emptySelector()
      next.leftCombinator = transformCombinator(el, current)
      return transformSelectorElement(next, first, tail)
    case 'pseudo':
      if (isPseudoElement(el)) {
        return transformPseudoElement(current, el, rest)
      }

      if (isPseudoClass(el)) {
        current.pseudoClass.push(transformPseudoClass(el))
      } else {
        assert.fail(
          "[style] Unexpected selector node: it has type 'pseudo' but neither pseudo element nor pseudo class."
        )
      }
      break
    case 'tag':
      current.tag = el.value
      break
    case 'id':
      current.id = el.value
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
  return transformSelectorElement(current, first, tail)
}

function transformPseudoClass(node: selectorParser.Pseudo): PseudoClass {
  const params = node.nodes as selectorParser.Selector[]

  return {
    type: 'PseudoClass',
    value: node.value.replace(/^:/, ''),
    params: params.map(p => transformSelector(p.nodes))
  }
}

function transformPseudoElement(
  parent: Selector,
  el: selectorParser.Pseudo,
  rest: selectorParser.Node[]
): Selector {
  const rawPseudoClass = takeWhile(rest, isPseudoClass)

  parent.pseudoElement = {
    type: 'PseudoElement',
    value: el.value.replace(/^:{1,2}/, ''),
    pseudoClass: rawPseudoClass.map(transformPseudoClass)
  }

  // No simple selector can follows after a paseudo element
  const [first, ...tail] = dropWhile(
    rest.slice(rawPseudoClass.length),
    el => !isCombinator(el)
  )

  return transformSelectorElement(parent, first, tail)
}

function transformAttribute(attr: selectorParser.Attribute): Attribute {
  return {
    type: 'Attribute',
    operator: attr.operator,
    name: attr.attribute,
    value: attr.raws.unquoted
  }
}

function transformCombinator(
  comb: selectorParser.Combinator,
  left: Selector
): Combinator {
  return {
    type: 'Combinator',
    operator: comb.value,
    left
  }
}

function transformDeclaration(
  decl: postcss.Declaration,
  path: number[]
): Declaration {
  return {
    type: 'Declaration',
    path,
    prop: decl.prop,
    value: decl.value,
    important: decl.important || false // decl.import is possibly undefined
  }
}

function transformChild(
  child: postcss.AtRule | postcss.Rule | postcss.Declaration,
  path: number[]
): ChildNode {
  switch (child.type) {
    case 'atrule':
      return transformAtRule(child, path)
    case 'rule':
      return transformRule(child, path)
    case 'decl':
      return transformDeclaration(child, path)
    default:
      return assert.fail(
        '[style] Unexpected child node type: ' + (child as any).type
      ) as never
  }
}

function visitLastSelectors(
  node: Style,
  fn: (selector: Selector) => void
): void {
  function loop(node: AtRule | Rule | Declaration): void {
    switch (node.type) {
      case 'AtRule':
        return node.children.forEach(loop)
      case 'Rule':
        return node.selectors.forEach(fn)
      default: // Do nothing
    }
  }
  return node.body.forEach(loop)
}

export function addScope(node: Style, scope: string): void {
  visitLastSelectors(node, selector => {
    selector.attributes.push({
      type: 'Attribute',
      name: scopePrefix + scope
    })
  })
}

function emptySelector(): Selector {
  return {
    type: 'Selector',
    universal: false,
    class: [],
    attributes: [],
    pseudoClass: []
  }
}

function isDeclaration(node: postcss.Node): node is postcss.Declaration {
  return node.type === 'decl'
}

function isCombinator(
  node: selectorParser.Node
): node is selectorParser.Combinator {
  return node.type === 'combinator'
}

function isPseudo(node: selectorParser.Node): node is selectorParser.Pseudo {
  return node.type === 'pseudo'
}

function isPseudoElement(
  node: selectorParser.Node
): node is selectorParser.Pseudo {
  return (
    isPseudo(node) &&
    (node.value.startsWith('::') ||
      // Must support legacy pseudo element syntax
      // for the below values
      // See: https://www.w3.org/TR/selectors-4/#pseudo-element-syntax
      node.value === ':before' ||
      node.value === ':after' ||
      node.value === ':first-letter' ||
      node.value === ':first-line')
  )
}

function isPseudoClass(
  node: selectorParser.Node
): node is selectorParser.Pseudo {
  return isPseudo(node) && !isPseudoElement(node)
}

function takeWhile<T, R extends T>(list: T[], fn: (value: T) => value is R): R[]
function takeWhile<T>(list: T[], fn: (value: T) => boolean): T[]
function takeWhile<T>(list: T[], fn: (value: T) => boolean): T[] {
  const res = []
  for (const item of list) {
    if (fn(item)) {
      res.push(item)
    } else {
      return res
    }
  }
  return res
}

function dropWhile<T>(list: T[], fn: (value: T) => boolean): T[] {
  const skip = takeWhile(list, fn)
  return list.slice(skip.length)
}

export interface Style {
  body: (AtRule | Rule)[]
}

interface Traversable {
  path: number[]
}

export interface Rule extends Traversable {
  type: 'Rule'
  selectors: Selector[]
  declarations: Declaration[]
}

export interface Declaration extends Traversable {
  type: 'Declaration'
  prop: string
  value: string
  important: boolean
}

export interface AtRule extends Traversable {
  type: 'AtRule'
  name: string
  params: string
  children: ChildNode[]
}

export type ChildNode = AtRule | Rule | Declaration

export interface Selector {
  type: 'Selector'
  universal: boolean
  tag?: string
  id?: string
  class: string[]
  attributes: Attribute[]
  pseudoClass: PseudoClass[]
  pseudoElement?: PseudoElement
  leftCombinator?: Combinator
}

export interface PseudoClass {
  type: 'PseudoClass'
  value: string
  params: Selector[]
}

export interface PseudoElement {
  type: 'PseudoElement'
  value: string
  pseudoClass: PseudoClass[]
}

export interface Attribute {
  type: 'Attribute'
  operator?: selectorParser.AttributeOperator
  name: string
  value?: string
}

export interface Combinator {
  type: 'Combinator'
  operator: string
  left: Selector
}
