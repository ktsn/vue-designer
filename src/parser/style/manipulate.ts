import * as t from './types'
import assert from 'assert'
import { clone, unquote } from '../../utils'
import { AssetResolver } from '../../asset-resolver'

interface StyleVisitor {
  atRule?(atRule: t.STAtRule): t.STAtRule | void
  rule?(rule: t.STRule): t.STRule | void
  declaration?(decl: t.STDeclaration): t.STDeclaration | void
  lastSelector?(selector: t.STSelector, rule: t.STRule): t.STSelector | void
}

export const scopePrefix = 'data-scope-'

function visitStyle(style: t.STStyle, visitor: StyleVisitor): t.STStyle {
  function apply<T>(node: T, visitor?: (node: T) => T | void): T {
    return visitor ? visitor(node) || node : node
  }

  function loop(
    node: t.STAtRule | t.STRule | t.STDeclaration
  ): t.STAtRule | t.STRule | t.STDeclaration {
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
      default:
        return assert.fail('Unexpected node type: ' + (node as any).type)
    }
  }

  return clone(style, {
    children: style.children.map(loop)
  })
}

export function visitLastSelectors(
  root: t.STStyle,
  fn: (selector: t.STSelector, rule: t.STRule) => t.STSelector | void
): t.STStyle {
  return visitStyle(root, { lastSelector: fn })
}

/**
 * Excludes selectors in @keyframes
 */
function isInterestSelector(rule: t.STRule, root: t.STStyle): boolean {
  const atRules = rule.path
    .slice(1)
    .reduce<t.STChild[]>((nodes, index) => {
      const prev = (nodes[nodes.length - 1] || root) as t.HasChildren<t.STChild>
      assert(
        'children' in prev,
        '[style manipulate] the rule probably has an invalid path.'
      )

      return nodes.concat(prev.children[index])
    }, [])
    .filter((n): n is t.STAtRule => n.type === 'AtRule')

  return atRules.every(r => !/-?keyframes$/.test(r.name))
}

export function resolveAsset(
  style: t.STStyle,
  basePath: string,
  resolver: AssetResolver
): t.STStyle {
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

export function addScope(node: t.STStyle, scope: string): t.STStyle {
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
  styles: t.STStyle[],
  path: number[]
): t.STChild | undefined {
  return path.reduce<any>(
    (acc, i) => {
      if (acc && acc.children) {
        return acc.children[i]
      }
      return undefined
    },
    { children: styles }
  )
}

export function getDeclaration(
  styles: t.STStyle[],
  path: number[]
): t.STDeclaration | undefined {
  const res = getNode(styles, path)
  return res && res.type === 'Declaration' ? res : undefined
}
