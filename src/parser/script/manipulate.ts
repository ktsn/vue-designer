import assert from 'assert'
import * as t from '@babel/types'
import { Prop, Data, ChildComponent, DefaultValue } from './types'

type StaticKey = t.Identifier | t.StringLiteral | t.NumericLiteral

export function extractProps(program: t.Program): Prop[] {
  const options = findComponentOptions(program.body)
  if (!options) return []

  const props = findProperty(options.properties, 'props')
  if (!props) return []

  if (t.isObjectExpression(props.value)) {
    return props.value.properties.filter(isStaticProperty).map(p => {
      const key = p.key as StaticKey
      return {
        name: getStaticKeyName(key),
        type: getPropType(p.value),
        default: getPropDefault(p.value)
      }
    })
  } else if (t.isArrayExpression(props.value)) {
    return props.value.elements
      .filter((el): el is t.StringLiteral => !!el && isStringLiteral(el))
      .map(el => {
        return {
          name: el.value,
          type: 'any',
          default: undefined
        }
      })
  } else {
    return []
  }
}

export function extractData(program: t.Program): Data[] {
  const options = findComponentOptions(program.body)
  if (!options) return []

  const data = findPropertyOrMethod(options.properties, 'data')
  if (!data) return []

  const obj = getDataObject(data)
  if (!obj) return []

  return obj.properties.filter(isStaticProperty).map(p => {
    const key = p.key as StaticKey
    return {
      name: getStaticKeyName(key),
      default: getLiteralValue(p.value)
    }
  })
}

export function extractChildComponents(
  program: t.Program,
  uri: string,
  localPathToUri: (localPath: string) => string
): ChildComponent[] {
  const imports = getImportDeclarations(program.body)
  const options = findComponentOptions(program.body)
  if (!options) return []

  const childComponents = []

  const selfName = findProperty(options.properties, 'name')
  if (selfName && isStringLiteral(selfName.value)) {
    childComponents.push({
      name: selfName.value.value,
      uri
    })
  }

  const components = findProperty(options.properties, 'components')
  if (components) {
    childComponents.push(
      ...extractComponents(components, imports, localPathToUri)
    )
  }

  const lifecycle = findPropertyOrMethod(options.properties, 'beforeCreate')
  if (lifecycle) {
    childComponents.push(
      ...extractLazyAddComponents(lifecycle, imports, localPathToUri)
    )
  }

  return childComponents
}

function extractComponents(
  prop: t.ObjectProperty,
  imports: Record<string, t.ImportDeclaration>,
  localPathToUri: (localPath: string) => string
): ChildComponent[] {
  if (!t.isObjectExpression(prop.value)) {
    return []
  }

  return prop.value.properties
    .map(
      (p): ChildComponent | undefined => {
        if (!isStaticProperty(p) || !t.isIdentifier(p.value)) {
          return undefined
        }

        return findMatchingComponent(
          getStaticKeyName(p.key as StaticKey),
          p.value.name,
          imports,
          localPathToUri
        )
      }
    )
    .filter(<T>(p: T | undefined): p is T => p !== undefined)
}

function extractLazyAddComponents(
  prop: t.ObjectProperty | t.ObjectMethod,
  imports: Record<string, t.ImportDeclaration>,
  localPathToUri: (localPath: string) => string
): ChildComponent[] {
  const func = normalizeMethod(prop)
  if (!func || !t.isBlockStatement(func.body)) {
    return []
  }

  // Extract all `this.$options.components.LocalComponentName = ComponentName`
  return func.body.body
    .map(
      (st): ChildComponent | undefined => {
        // We leave this chack as loosely since the user may not write
        // `this.$options.components.LocalComponentName = ComponentName`
        // but assign `components` to another variable to save key types.
        // If there are false positive in this check, they probably be
        // proned by maching with imported components in later.
        if (
          !t.isExpressionStatement(st) ||
          !t.isAssignmentExpression(st.expression) ||
          !t.isIdentifier(st.expression.right) || // = ComponentName
          !t.isMemberExpression(st.expression.left) ||
          !t.isIdentifier(st.expression.left.property) // .LocalComponentName
        ) {
          return undefined
        }

        return findMatchingComponent(
          st.expression.right.name,
          st.expression.left.property.name,
          imports,
          localPathToUri
        )
      }
    )
    .filter(<T>(p: T | undefined): p is T => p !== undefined)
}

function getImportDeclarations(
  body: t.Statement[]
): Record<string, t.ImportDeclaration> {
  const res: Record<string, t.ImportDeclaration> = {}
  body.forEach(node => {
    if (!t.isImportDeclaration(node)) return

    // Collect all declared local variables in import declaration into record
    // to store all possible components.
    node.specifiers.forEach(s => {
      res[s.local.name] = node
    })
  })
  return res
}

function findMatchingComponent(
  localName: string,
  importedName: string,
  imports: Record<string, t.ImportDeclaration>,
  localPathToUri: (localPath: string) => string
): ChildComponent | undefined {
  const componentImport = imports[importedName]
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
}

function isStringLiteral(node: t.Node): node is t.StringLiteral {
  return t.isStringLiteral(node)
}

/**
 * Check if the property has a statically defined key
 * If it returns `true`, `node.key` should be `StaticKey`.
 */
function isStaticProperty(
  node: t.ObjectProperty | t.ObjectMethod | t.SpreadProperty
): node is t.ObjectProperty {
  return t.isObjectProperty(node) && !node.computed
}

function isStaticPropertyOrMethod(
  node: t.ObjectProperty | t.ObjectMethod | t.SpreadProperty
): node is t.ObjectProperty | t.ObjectMethod {
  return isStaticProperty(node) || (t.isObjectMethod(node) && !node.computed)
}

function getStaticKeyName(key: StaticKey): string {
  return t.isIdentifier(key) ? key.name : String(key.value)
}

/**
 * Find a property name that matches the specified property name.
 */
export function findProperty(
  props: (t.ObjectProperty | t.ObjectMethod | t.SpreadProperty)[],
  name: string
): t.ObjectProperty | undefined {
  return props.filter(isStaticProperty).find(p => {
    const key = p.key as StaticKey
    return getStaticKeyName(key) === name
  })
}

function findPropertyOrMethod(
  props: (t.ObjectProperty | t.ObjectMethod | t.SpreadProperty)[],
  name: string
): t.ObjectProperty | t.ObjectMethod | undefined {
  return props.filter(isStaticPropertyOrMethod).find(p => {
    const key = p.key as StaticKey
    return getStaticKeyName(key) === name
  })
}

/**
 * Return function-like node if object property has
 * function value or it is a method.
 * Return undefined if it does not have a function value.
 */
function normalizeMethod(
  prop: t.ObjectProperty | t.ObjectMethod
): t.Function | undefined {
  if (t.isObjectMethod(prop)) {
    return prop
  }
  if (t.isFunction(prop.value)) {
    return prop.value as t.Function
  }
  return undefined
}

/**
 * Detect `Vue.extend(...)`
 */
function isVueExtend(
  node: t.Declaration | t.Expression
): node is t.CallExpression {
  if (!t.isCallExpression(node) || !t.isMemberExpression(node.callee)) {
    return false
  }

  const property = node.callee.property
  if (!t.isIdentifier(property, { name: 'extend' })) {
    return false
  }

  const object = node.callee.object
  if (!object || !t.isIdentifier(object, { name: 'Vue' })) {
    return false
  }

  return true
}

function getPropType(value: t.Expression | t.PatternLike): string {
  if (t.isIdentifier(value)) {
    // Constructor
    return value.name
  } else if (t.isObjectExpression(value)) {
    // Detailed prop definition
    // { type: ..., ... }
    const type = findProperty(value.properties, 'type')

    if (type && t.isIdentifier(type.value)) {
      return type.value.name
    }
  }

  return 'any'
}

function getPropDefault(value: t.Expression | t.PatternLike): DefaultValue {
  if (t.isObjectExpression(value)) {
    // Find `default` property in the prop option.
    const def = findPropertyOrMethod(value.properties, 'default')

    if (def) {
      // If it is a function, extract default value from it,
      // otherwise just use the value.
      const func = normalizeMethod(def)
      if (func) {
        const exp = getReturnedExpression(func.body)
        return exp && getLiteralValue(exp)
      } else {
        return getLiteralValue((def as t.ObjectProperty).value)
      }
    }
  }
  return undefined
}

function getDataObject(
  prop: t.ObjectProperty | t.ObjectMethod
): t.ObjectExpression | undefined {
  // If the value is an object expression, just return it.
  if (t.isObjectProperty(prop)) {
    const value = prop.value
    if (t.isObjectExpression(value)) {
      return value
    }
  }

  // If the value is a function, return the returned object expression
  const func = normalizeMethod(prop)
  if (func) {
    const exp = getReturnedExpression(func.body)
    if (exp && t.isObjectExpression(exp)) {
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
  block: t.BlockStatement | t.Expression
): t.Expression | undefined {
  if (t.isBlockStatement(block)) {
    const statements = block.body.slice().reverse()
    for (const s of statements) {
      if (t.isReturnStatement(s)) {
        return s.argument || undefined
      }
    }
  } else {
    return block
  }
}

function getLiteralValue(node: t.Node): DefaultValue {
  // Simple literals like number, string and boolean
  if (
    t.isStringLiteral(node) ||
    t.isNumericLiteral(node) ||
    t.isBooleanLiteral(node)
  ) {
    return node.value
  }

  if (t.isNullLiteral(node)) {
    return null
  }

  // Object literal
  if (t.isObjectExpression(node)) {
    const obj: Record<string, DefaultValue> = {}
    node.properties.forEach(p => {
      if (!t.isObjectProperty(p)) {
        return
      }

      if (p.computed || !t.isIdentifier(p.key)) {
        return
      }

      obj[p.key.name] = getLiteralValue(p.value)
    })
    return obj
  }

  // Array literal
  if (t.isArrayExpression(node)) {
    return node.elements
      .filter(<T>(x: T | null): x is T => !!x)
      .map(getLiteralValue)
  }

  return undefined
}

export function findComponentOptions(
  body: t.Statement[]
): t.ObjectExpression | undefined {
  const exported = body.find(
    (n): n is t.ExportDefaultDeclaration => t.isExportDefaultDeclaration(n)
  )
  if (!exported) return undefined

  // TODO: support class style component
  const dec = exported.declaration
  if (t.isObjectExpression(dec)) {
    // Using object literal definition
    // export default {
    //   ...
    // }
    return dec
  } else if (isVueExtend(dec) && t.isObjectExpression(dec.arguments[0])) {
    // Using Vue.extend with object literal
    // export default Vue.extend({
    //   ...
    // })
    return dec.arguments[0] as t.ObjectExpression
  }
  return undefined
}
