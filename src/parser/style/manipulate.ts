import * as t from './types'
import { clone } from '../../utils'

export const scopePrefix = 'data-scope-'

export function visitLastSelectors(
  node: t.Style,
  fn: (selector: t.Selector, rule: t.Rule) => t.Selector | void
): t.Style {
  function loop(node: t.AtRule | t.Rule): t.AtRule | t.Rule
  function loop(
    node: t.AtRule | t.Rule | t.Declaration
  ): t.AtRule | t.Rule | t.Declaration
  function loop(
    node: t.AtRule | t.Rule | t.Declaration
  ): t.AtRule | t.Rule | t.Declaration {
    switch (node.type) {
      case 'AtRule':
        return clone(node, {
          children: node.children.map(loop)
        })
      case 'Rule':
        return clone(node, {
          selectors: node.selectors.map(s => fn(s, node) || s)
        })
      default:
        // Do nothing
        return node
    }
  }
  return clone(node, {
    body: node.body.map(b => loop(b))
  })
}

export function addScope(node: t.Style, scope: string): t.Style {
  return visitLastSelectors(node, selector => {
    return clone(selector, {
      attributes: selector.attributes.concat({
        type: 'Attribute',
        name: scopePrefix + scope
      })
    })
  })
}
