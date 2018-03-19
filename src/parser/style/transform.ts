import assert from 'assert'
import postcss from 'postcss'
import selectorParser from 'postcss-selector-parser'
import { genSelector } from './codegen'
import * as t from './types'
import { takeWhile, dropWhile } from '../../utils'

export function transformStyle(
  root: postcss.Root,
  code: string,
  index: number
): t.Style {
  if (!root.nodes) {
    return {
      path: [index],
      body: [],
      range: [-1, -1]
    }
  }
  const body = root.nodes
    .map((node, i) => {
      switch (node.type) {
        case 'atrule':
          return transformAtRule(node, [index, i], code)
        case 'rule':
          return transformRule(node, [index, i], code)
        default:
          return undefined
      }
    })
    .filter((node): node is t.AtRule | t.Rule => {
      return node !== undefined
    })

  return {
    path: [index],
    body,
    range: toRange(root.source, code)
  }
}

function transformAtRule(
  atRule: postcss.AtRule,
  path: number[],
  code: string
): t.AtRule {
  const isNotComment = <T extends postcss.Node>(
    node: T | postcss.Comment
  ): node is T => {
    return node.type !== 'comment'
  }

  const children = atRule.nodes ? atRule.nodes.filter(isNotComment) : []

  return {
    type: 'AtRule',
    path,
    before: atRule.raws.before || '',
    after: atRule.raws.after || '',
    name: atRule.name,
    params: atRule.params,
    children: children.map((child, i) => {
      return transformChild(child, path.concat(i), code)
    }),
    range: toRange(atRule.source, code)
  }
}

function transformRule(
  rule: postcss.Rule,
  path: number[],
  code: string
): t.Rule {
  const decls = rule.nodes ? rule.nodes.filter(isDeclaration) : []
  const root = selectorParser().astSync(rule.selector)

  return {
    type: 'Rule',
    path,
    before: rule.raws.before || '',
    after: rule.raws.after || '',
    selectors: root.nodes.map(n => {
      // A child of root node is always selector
      const selectors = (n as selectorParser.Selector).nodes
      return transformSelector(selectors)
    }),
    declarations: decls.map((decl, i) => {
      return transformDeclaration(decl, path.concat(i), code)
    }),
    range: toRange(rule.source, code)
  }
}

function transformSelector(nodes: selectorParser.Node[]): t.Selector {
  const [first, ...tail] = nodes
  return transformSelectorElement(emptySelector(), first, tail)
}

function transformSelectorElement(
  current: t.Selector,
  el: selectorParser.Node | undefined,
  rest: selectorParser.Node[]
): t.Selector {
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

function transformPseudoClass(node: selectorParser.Pseudo): t.PseudoClass {
  const params = node.nodes as selectorParser.Selector[]

  return {
    type: 'PseudoClass',
    value: node.value.replace(/^:/, ''),
    params: params.map(p => transformSelector(p.nodes))
  }
}

function transformPseudoElement(
  parent: t.Selector,
  el: selectorParser.Pseudo,
  rest: selectorParser.Node[]
): t.Selector {
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

function transformAttribute(attr: selectorParser.Attribute): t.Attribute {
  return {
    type: 'Attribute',
    operator: attr.operator,
    name: attr.attribute,
    value: attr.raws.unquoted
  }
}

function transformCombinator(
  comb: selectorParser.Combinator,
  left: t.Selector
): t.Combinator {
  return {
    type: 'Combinator',
    operator: comb.value,
    left
  }
}

function transformDeclaration(
  decl: postcss.Declaration,
  path: number[],
  code: string
): t.Declaration {
  return {
    type: 'Declaration',
    path,
    before: decl.raws.before || '',
    after: decl.raws.after || '',
    prop: decl.prop,
    value: decl.value,
    important: decl.important || false, // decl.import is possibly undefined
    range: toRange(decl.source, code)
  }
}

function transformChild(
  child: postcss.AtRule | postcss.Rule | postcss.Declaration,
  path: number[],
  code: string
): t.ChildNode {
  switch (child.type) {
    case 'atrule':
      return transformAtRule(child, path, code)
    case 'rule':
      return transformRule(child, path, code)
    case 'decl':
      return transformDeclaration(child, path, code)
    default:
      return assert.fail(
        '[style] Unexpected child node type: ' + (child as any).type
      ) as never
  }
}

function toRange(source: postcss.NodeSource, code: string): [number, number] {
  const start = source.start
    ? toOffset(source.start.line, source.start.column, code)
    : 0

  // The postcss end position is short by one
  const end = source.end
    ? toOffset(source.end.line, source.end.column, code) + 1
    : code.length

  return [start, end]
}

function toOffset(line: number, column: number, code: string): number {
  const codeLines = code.split('\n')
  const beforeLines = codeLines.slice(0, line - 1)

  const beforeLength = beforeLines.reduce((acc, line) => {
    // +1 to include line break
    return acc + line.length + 1
  }, 0)
  return beforeLength + column - 1
}

export function transformRuleForPrint(rule: t.Rule): t.RuleForPrint {
  return {
    path: rule.path,
    selectors: rule.selectors.map(genSelector),
    declarations: rule.declarations.map(decl => ({
      path: decl.path,
      prop: decl.prop,
      value: decl.value,
      important: decl.important
    }))
  }
}

function emptySelector(): t.Selector {
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
