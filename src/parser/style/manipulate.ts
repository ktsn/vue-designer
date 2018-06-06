import * as t from './types'
import { clone, unquote } from '../../utils'
import { AssetResolver } from '../../asset-resolver'

interface StyleVisitor {
  atRule?(atRule: t.AtRule): t.AtRule | void
  rule?(rule: t.Rule): t.Rule | void
  declaration?(decl: t.Declaration): t.Declaration | void
}

export const scopePrefix = 'data-scope-'

function visitStyle(style: t.Style, visitor: StyleVisitor): t.Style {
  function apply<T>(node: T, visitor?: (node: T) => T | void): T {
    return visitor ? visitor(node) || node : node
  }

  function loop(
    node: t.AtRule | t.Rule | t.Declaration
  ): t.AtRule | t.Rule | t.Declaration {
    switch (node.type) {
      case 'AtRule':
        return clone(apply(node, visitor.atRule), {
          children: node.children.map(loop)
        })
      case 'Rule':
        return clone(apply(node, visitor.rule), {
          children: node.children.map(loop)
        })
      case 'Declaration':
        return apply(node, visitor.declaration)
    }
  }

  return clone(style, {
    body: style.body.map(loop)
  })
}

export function visitLastSelectors(
  node: t.Style,
  fn: (selector: t.Selector, rule: t.Rule) => t.Selector | void
): t.Style {
  return visitStyle(node, {
    rule: rule => {
      return clone(rule, {
        selectors: rule.selectors.map(s => fn(s, rule) || s)
      })
    }
  })
}

export function resolveAsset(
  style: t.Style,
  basePath: string,
  resolver: AssetResolver
): t.Style {
  return visitStyle(style, {
    declaration: decl => {
      const value = decl.value
      const replaced = value.replace(/url\(([^)]+)\)/g, (_, p) => {
        const unquoted = unquote(p)
        const resolved = resolver.pathToUrl(unquoted, basePath)
        return 'url(' + (resolved ? JSON.stringify(resolved) : p) + ')'
      })
      return replaced !== value
        ? clone(decl, {
            value: replaced
          })
        : decl
    }
  })
}

export function addScope(node: t.Style, scope: string): t.Style {
  return visitLastSelectors(node, selector => {
    return clone(selector, {
      attributes: selector.attributes.concat({
        type: 'Attribute',
        name: scopePrefix + scope,
        insensitive: false
      })
    })
  })
}

export function getNode(
  styles: t.Style[],
  path: number[]
): t.ChildNode | undefined {
  return path.reduce<any | undefined>(
    (acc, i) => {
      if (!acc) return

      if (acc.children) {
        return acc.children[i]
      } else if (acc.body) {
        return acc.body[i]
      } else if (acc.declarations) {
        return acc.declarations[i]
      }
    },
    { children: styles }
  )
}

export function getDeclaration(
  styles: t.Style[],
  path: number[]
): t.Declaration | undefined {
  const res = getNode(styles, path)
  return res && res.type === 'Declaration' ? res : undefined
}
