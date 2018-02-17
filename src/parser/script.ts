import assert from 'assert'
import * as AST from 'babel-types'

export function extractProps(program: AST.Program): Prop[] {
  const options = findComponentOptions(program.body)
  if (!options) return []

  const props = options.properties.find((p): p is
    | AST.ObjectProperty
    | AST.ObjectMethod => {
    return isStaticProperty(p) && (p.key as AST.Identifier).name === 'props'
  })

  if (!props) return []

  if (props.value.type === 'ObjectExpression') {
    return props.value.properties.filter(isStaticProperty).map(p => {
      const key = p.key as AST.Identifier
      return {
        name: key.name,
        type: getPropType(p.value),
        default: getPropDefault(p.value)
      }
    })
  } else if (props.value.type === 'ArrayExpression') {
    return props.value.elements.filter(isStringLiteral).map(el => {
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

export function extractData(program: AST.Program): Data[] {
  const options = findComponentOptions(program.body)
  if (!options) return []

  const data = options.properties.find((p): p is
    | AST.ObjectProperty
    | AST.ObjectMethod => {
    return isStaticProperty(p) && (p.key as AST.Identifier).name === 'data'
  })

  if (!data) return []

  const obj = getDataObject(data)
  if (!obj) return []

  return obj.properties.filter(isStaticProperty).map(p => {
    const key = p.key as AST.Identifier
    return {
      name: key.name,
      default: getLiteralValue(p.value)
    }
  })
}

export function extractChildComponents(
  program: AST.Program,
  localPathToUri: (localPath: string) => string
): ChildComponent[] {
  const imports = getImportDeclarations(program.body)
  const options = findComponentOptions(program.body)
  if (!options) return []

  const components = options.properties.find((p): p is
    | AST.ObjectProperty
    | AST.ObjectMethod => {
    return (
      isStaticProperty(p) && (p.key as AST.Identifier).name === 'components'
    )
  })

  if (!components || components.value.type !== 'ObjectExpression') {
    return []
  }

  return components.value.properties
    .map((p): ChildComponent | undefined => {
      if (
        !isStaticProperty(p) ||
        p.key.type !== 'Identifier' ||
        p.value.type !== 'Identifier'
      ) {
        return undefined
      }

      const localName = p.key.name
      const componentImport = imports[p.value.name]
      if (!componentImport) return undefined

      const sourcePath = componentImport.source.value as string
      assert(
        typeof sourcePath === 'string',
        '[script] Import declaration unexpectedly has non-string literal: ' +
          sourcePath
      )

      return {
        name: localName,
        uri: localPathToUri(sourcePath)
      }
    })
    .filter(<T>(p: T | undefined): p is T => p !== undefined)
}

function getImportDeclarations(
  body: AST.Statement[]
): Record<string, AST.ImportDeclaration> {
  const res: Record<string, AST.ImportDeclaration> = {}
  body.forEach(node => {
    if (node.type !== 'ImportDeclaration') return

    // Collect all declared local variables in import declaration into record
    // to store all possible components.
    node.specifiers.forEach(s => {
      res[s.local.name] = node
    })
  })
  return res
}

function isStringLiteral(node: AST.Node): node is AST.StringLiteral {
  return node.type === 'StringLiteral'
}

/**
 * Check if the property has a statically defined key
 * If it returns `true`, `node.key` should be `Identifier`.
 */
function isStaticProperty(
  node: AST.ObjectProperty | AST.ObjectMethod | AST.SpreadProperty
): node is AST.ObjectProperty | AST.ObjectMethod {
  return (
    (node.type === 'ObjectProperty' || node.type === 'ObjectMethod') &&
    node.key.type === 'Identifier'
  )
}

/**
 * Detect `Vue.extend(...)`
 */
function isVueExtend(
  node: AST.Declaration | AST.Expression
): node is AST.CallExpression {
  if (
    node.type !== 'CallExpression' ||
    node.callee.type !== 'MemberExpression'
  ) {
    return false
  }

  const property = node.callee.property
  if (property.type !== 'Identifier' || property.name !== 'extend') {
    return false
  }

  const object = node.callee.object
  if (!object || object.type !== 'Identifier' || object.name !== 'Vue') {
    return false
  }

  return true
}

function getPropType(value: AST.Expression | AST.Pattern): string {
  if (value.type === 'Identifier') {
    // Constructor
    return value.name
  } else if (value.type === 'ObjectExpression') {
    // Detailed prop definition
    // { type: ..., ... }
    const type = value.properties.find((p): p is
      | AST.ObjectProperty
      | AST.ObjectMethod => {
      return isStaticProperty(p) && (p.key as AST.Identifier).name === 'type'
    })

    if (type && type.value && type.value.type === 'Identifier') {
      return type.value.name
    }
  }

  return 'any'
}

function getPropDefault(value: AST.Expression | AST.Pattern): DefaultValue {
  if (value.type === 'ObjectExpression') {
    // Find `default` property in the prop option.
    const def = value.properties.find((p): p is
      | AST.ObjectProperty
      | AST.ObjectMethod => {
      return isStaticProperty(p) && (p.key as AST.Identifier).name === 'default'
    })

    if (def) {
      // If it is a function, extract default value from it,
      // otherwise just use the value.
      if (
        def.value.type === 'FunctionExpression' ||
        def.value.type === 'ArrowFunctionExpression'
      ) {
        const exp = getReturnedExpression(def.value.body)
        return exp && getLiteralValue(exp)
      } else {
        return getLiteralValue(def.value)
      }
    }
  }
  return undefined
}

function getDataObject(
  prop: AST.ObjectProperty | AST.ObjectMethod
): AST.ObjectExpression | undefined {
  if (prop.type === 'ObjectProperty') {
    const value = prop.value

    if (value.type === 'ObjectExpression') return value

    if (
      value.type === 'FunctionExpression' ||
      value.type === 'ArrowFunctionExpression'
    ) {
      const exp = getReturnedExpression(value.body)
      if (exp && exp.type === 'ObjectExpression') {
        return exp
      }
    }
  } else {
    const exp = getReturnedExpression(prop.body)
    if (exp && exp.type === 'ObjectExpression') {
      return exp
    }
  }

  return undefined
}

/**
 * Extract returned expression in function body.
 * The function `body` should be `BlockStatement` in the declared type
 * but it can be other expressions if it forms like `() => ({ foo: 'bar' })`
 */
function getReturnedExpression(
  block: AST.BlockStatement | AST.Expression
): AST.Expression | undefined {
  if (block.type === 'BlockStatement') {
    const statements = block.body.slice().reverse()
    for (const s of statements) {
      if (s.type === 'ReturnStatement') {
        return s.argument || undefined
      }
    }
  } else {
    return block
  }
}

function getLiteralValue(node: AST.Node): DefaultValue {
  // Simple literals like number, string and boolean
  if (node.type === 'StringLiteral') {
    return (node as AST.StringLiteral).value
  }

  if (node.type === 'NumericLiteral') {
    return (node as AST.NumericLiteral).value
  }

  if (node.type === 'BooleanLiteral') {
    return (node as AST.BooleanLiteral).value
  }

  if (node.type === 'NullLiteral') {
    return null
  }

  // Object literal
  if (node.type === 'ObjectExpression') {
    const obj: Record<string, DefaultValue> = {}
    ;(node as AST.ObjectExpression).properties.forEach(p => {
      if (p.type !== 'ObjectProperty') {
        return
      }

      if (p.computed || p.key.type !== 'Identifier') {
        return
      }

      obj[p.key.name] = getLiteralValue(p.value)
    })
    return obj
  }

  // Array literal
  if (node.type === 'ArrayExpression') {
    return (node as AST.ArrayExpression).elements.map(getLiteralValue)
  }

  return undefined
}

function findComponentOptions(
  body: AST.Statement[]
): AST.ObjectExpression | undefined {
  const exported = body.find(n => n.type === 'ExportDefaultDeclaration') as
    | AST.ExportDefaultDeclaration
    | undefined
  if (!exported) return undefined

  // TODO: support class style component
  const dec = exported.declaration
  if (dec.type === 'ObjectExpression') {
    // Using object literal definition
    // export default {
    //   ...
    // }
    return dec
  } else if (isVueExtend(dec) && dec.arguments[0].type === 'ObjectExpression') {
    // Using Vue.extend with object literal
    // export default Vue.extend({
    //   ...
    // })
    return dec.arguments[0] as AST.ObjectExpression
  }
  return undefined
}

interface RecordDefaultValue extends Record<string, DefaultValue> {}
interface ArrayDefaultValue extends Array<DefaultValue> {}

export type DefaultValue =
  | RecordDefaultValue
  | ArrayDefaultValue
  | boolean
  | number
  | string
  | null
  | undefined

export interface Prop {
  name: string
  type: string
  default?: DefaultValue
}

export interface Data {
  name: string
  default?: DefaultValue
}

export interface ChildComponent {
  name: string
  uri: string
}
