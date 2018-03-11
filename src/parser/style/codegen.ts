import assert from 'assert'
import * as t from './types'

export function genStyle(ast: t.Style): string {
  return ast.body
    .map(node => {
      switch (node.type) {
        case 'AtRule':
          return genAtRule(node)
        case 'Rule':
          return genRule(node)
        default:
          assert.fail(
            `[style codegen] Unexpected node type ${(node as any).type} on root`
          )
      }
    })
    .join('\n')
}

function genAtRule(atRule: t.AtRule): string {
  let buf = `@${atRule.name} ${atRule.params}`

  if (atRule.children.length > 0) {
    const children = atRule.children
      .map(child => {
        switch (child.type) {
          case 'AtRule':
            return genAtRule(child)
          case 'Rule':
            return genRule(child)
          case 'Declaration':
            return genDeclaration(child)
          default:
            assert.fail(
              `[style codegen] Unexpected node type ${
                (child as any).type
              } as child of AtRule`
            )
        }
      })
      .join(' ')

    buf += ' {' + children + '}'
  } else {
    buf += ';'
  }

  return buf
}

function genRule(rule: t.Rule): string {
  const selectors = rule.selectors.map(genSelector).join(', ')
  const declarations = rule.declarations.map(genDeclaration).join(' ')

  return `${selectors} {${declarations}}`
}

export function genSelector(s: t.Selector): string {
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
    const attrsCodes = s.attributes.map(attr => {
      if (attr.operator != null && attr.value != null) {
        return `[${attr.name}${attr.operator}"${attr.value}"]`
      } else {
        return `[${attr.name}]`
      }
    })
    buf += attrsCodes.join('')
  }

  if (s.pseudoClass.length > 0) {
    buf += s.pseudoClass.map(genPseudoClass).join('')
  }

  if (s.pseudoElement) {
    buf += '::' + s.pseudoElement.value

    const pseudoClass = s.pseudoElement.pseudoClass
    if (pseudoClass.length > 0) {
      buf += pseudoClass.map(genPseudoClass).join('')
    }
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

function genPseudoClass(node: t.PseudoClass): string {
  if (node.params.length > 0) {
    const selectors = node.params.map(genSelector).join(', ')
    return ':' + node.value + '(' + selectors + ')'
  } else {
    return ':' + node.value
  }
}

function genDeclaration(decl: t.Declaration): string {
  let buf = decl.prop + ': ' + decl.value

  if (decl.important) {
    buf += ' !important'
  }

  return buf + ';'
}