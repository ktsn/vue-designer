import { AST } from 'vue-eslint-parser'

export function extractProps(body: AST.ESLintNode[]): Prop[] {
  const options = findComponentOptions(body)
  if (!options) return []

  const props = options.properties.find(p => {
    return isStaticProperty(p) && (p.key as AST.ESLintIdentifier).name === 'props'
  }) as AST.ESLintProperty | undefined
  if (!props) return[]

  if (props.value.type === 'ObjectExpression') {
    return props.value.properties
      .filter(isStaticProperty)
      .map(p => {
        const key = (p.key as AST.ESLintIdentifier)
        return {
          name: key.name,
          type: getPropType(p.value),
          default: getPropDefault(p.value)
        }
      })
  } else if (props.value.type === 'ArrayExpression') {
    return props.value.elements
      .filter(isStringLiteral)
      .map(el => {
        return {
          name: el.value as string,
          type: 'any',
          default: undefined
        }
      })
  } else {
    return []
  }
}

function isStringLiteral(node: AST.ESLintNode): node is AST.ESLintLiteral {
  return node.type === 'Literal' && typeof node.value === 'string'
}

function isStaticProperty(node: AST.ESLintNode | AST.ESLintLegacySpreadProperty): node is AST.ESLintProperty {
  return node.type === 'Property' && node.key.type === 'Identifier'
}

function getPropType(value: AST.ESLintExpression | AST.ESLintPattern): string {
  if (value.type === 'Identifier') {
    // Constructor
    return value.name
  } else if (value.type === 'ObjectExpression') {
    // Detailed prop definition
    // { type: ..., ... }
    const type = value.properties.find(p => {
      return isStaticProperty(p) && (p.key as AST.ESLintIdentifier).name === 'type'
    }) as AST.ESLintProperty | undefined

    if (type && type.value.type === 'Identifier') {
      return type.value.name
    }
  }

  return 'any'
}

function getPropDefault(value: AST.ESLintExpression | AST.ESLintPattern): DefaultValue {
  if (value.type === 'ObjectExpression') {
    const def = value.properties.find(p => {
      return isStaticProperty(p) && (p.key as AST.ESLintIdentifier).name === 'default'
    }) as AST.ESLintProperty | undefined

    if (def) {
      if (def.value.type === 'Literal' && !(def.value.value instanceof RegExp)) {
        return def.value.value
      }
    }
  }
  return undefined
}

function findComponentOptions(body: AST.ESLintNode[]): AST.ESLintObjectExpression | null {
  const exported = body.find(n => n.type === 'ExportDefaultDeclaration') as AST.ESLintExportDefaultDeclaration | undefined
  if (!exported) return null

  // TODO: support Vue.extend and class style component
  if (exported.declaration.type !== 'ObjectExpression') {
    return null
  }
  return exported.declaration
}

type DefaultValue = boolean | number | string | null | undefined

export interface Prop {
  name: string
  type: string
  default?: DefaultValue
}