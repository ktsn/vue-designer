import * as t from './types'
import assert from 'assert'
import { clone, unquote } from '../../utils'
import { AssetResolver } from '../../asset-resolver'

interface StyleVisitor {
  atRule?(atRule: t.AtRule): t.AtRule | void
  rule?(rule: t.Rule): t.Rule | void
  declaration?(decl: t.Declaration): t.Declaration | void
  lastSelector?(selector: t.Selector, rule: t.Rule): t.Selector | void
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
          selectors: node.selectors.map(selector => {
            return visitor.lastSelector && isInterestSelector(node, style)
              ? visitor.lastSelector(selector, node) || selector
              : selector
          }),
          children: node.children.map(loop)
        })
      case 'Declaration':
        return apply(node, visitor.declaration)
    }
  }

  return clone(style, {
    children: style.children.map(loop)
  })
}

export function visitLastSelectors(
  root: t.Style,
  fn: (selector: t.Selector, rule: t.Rule) => t.Selector | void
): t.Style {
  return visitStyle(root, { lastSelector: fn })
}

/**
 * Excludes selectors in @keyframes
 */
function isInterestSelector(rule: t.Rule, root: t.Style): boolean {
  const atRules = rule.path
    .slice(1)
    .reduce<t.ChildNode[]>((nodes, index) => {
      const prev = (nodes[nodes.length - 1] || root) as t.HasChildren<
        t.ChildNode
      >
      assert(
        'children' in prev,
        '[style manipulate] the rule probably has an invalid path.'
      )

      return nodes.concat(prev.children[index])
    }, [])
    .filter((n): n is t.AtRule => n.type === 'AtRule')

  return atRules.every(r => !/-?keyframes$/.test(r.name))
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
  const keyframes = new Map<string, string>()

  const keyframesReplaced = visitStyle(node, {
    atRule(atRule) {
      if (/-?keyframes$/.test(atRule.name)) {
        const replaced = atRule.params + '-' + scope
        keyframes.set(atRule.params, replaced)

        return clone(atRule, {
          params: replaced
        })
      }
    }
  })

  return visitStyle(keyframesReplaced, {
    declaration: decl => {
      // individual animation-name declaration
      if (/^(-\w+-)?animation-name$/.test(decl.prop)) {
        return clone(decl, {
          value: decl.value
            .split(',')
            .map(v => keyframes.get(v.trim()) || v.trim())
            .join(',')
        })
      }

      // shorthand
      if (/^(-\w+-)?animation$/.test(decl.prop)) {
        return clone(decl, {
          value: decl.value
            .split(',')
            .map(v => {
              const vals = v.trim().split(/\s+/)
              const i = vals.findIndex(val => keyframes.has(val))
              if (i !== -1) {
                vals.splice(i, 1, keyframes.get(vals[i])!)
                return vals.join(' ')
              } else {
                return v
              }
            })
            .join(',')
        })
      }
    },

    lastSelector: selector => {
      return clone(selector, {
        attributes: selector.attributes.concat({
          type: 'Attribute',
          name: scopePrefix + scope,
          insensitive: false
        })
      })
    }
  })
}

export function getNode(
  styles: t.Style[],
  path: number[]
): t.ChildNode | undefined {
  return path.reduce<any>(
    (acc, i) => {
      if (!acc) return

      if (acc.children) {
        return acc.children[i]
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
