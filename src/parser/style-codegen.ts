import * as assert from 'assert'
import { Style, Rule, Selector, Declaration } from './style'

export function genStyle(ast: Style): string {
  return ast.body
    .map(node => {
      switch (node.type) {
        case 'Rule':
          return genRule(node)
        default:
          assert.fail(
            `[style codegen] Unexpected node type ${node.type} on root`
          )
      }
    })
    .join('\n\n')
}

function genRule(rule: Rule): string {
  const selectors = rule.selectors.map(genSelector).join(', ')

  return `${selectors} {}`
}

function genSelector(s: Selector): string {
  let buf = ''
  if (s.universal) {
    buf += '*'
  } else if (s.tag) {
    buf += s.tag
  }

  if (s.id) {
    buf += '#' + s.id
  }

  if (s.class.length > 0) {
    buf += s.class.map(c => '.' + c).join('')
  }

  if (s.attributes.length > 0) {
    const attrsCode = s.attributes.map(attr => {
      if (attr.operator != null && attr.value != null) {
        return `[${attr.name}${attr.operator}"${attr.value}"]`
      } else {
        return `[${attr.name}]`
      }
    })
    buf += attrsCode
  }

  if (s.pseudoClass.length > 0) {
    buf += s.pseudoClass
      .map(c => {
        if (c.params.length > 0) {
          const selectors = c.params.map(genSelector).join(',')
          return ':' + c.value + '(' + selectors + ')'
        } else {
          return ':' + c.value
        }
      })
      .join('')
  }

  if (s.pseudoElement) {
    buf += '::' + s.pseudoElement.value
  }

  if (s.leftCombinator) {
    buf =
      genSelector(s.leftCombinator.left) +
      ' ' +
      s.leftCombinator.operator +
      ' ' +
      buf
  }

  return buf
}
