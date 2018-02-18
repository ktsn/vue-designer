import assert from 'assert'
import * as AST from 'babel-types'

export function extractProps(program: AST.Program): Prop[] {
  const options = findComponentOptions(program.body)
  if (!options) return []

  const props = findProperty(options.properties, 'props')
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
        name: el.value,
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

  const data = findProperty(options.properties, 'data')
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
  uri: string,
  localPathToUri: (localPath: string) => string
): ChildComponent[] {
  const imports = getImportDeclarations(program.body)
  const options = findComponentOptions(program.body)
  if (!options) return []

  const childComponents = []

  const selfName = findProperty(options.properties, 'name')
  if (selfName && selfName.value && isStringLiteral(selfName.value)) {
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

  const lifecycle = findProperty(options.properties, 'beforeCreate')
  if (lifecycle) {
    childComponents.push(
      ...extractLazyAddComponents(lifecycle, imports, localPathToUri)
    )
  }

  return childComponents
}

function extractComponents(
  prop: AST.ObjectProperty | AST.ObjectMethod,
  imports: Record<string, AST.ImportDeclaration>,
  localPathToUri: (localPath: string) => string
): ChildComponent[] {
  if (!prop.value || prop.value.type !== 'ObjectExpression') {
    return []
  }

  return prop.value.properties
    .map((p): ChildComponent | undefined => {
      if (
        !isStaticProperty(p) ||
        p.key.type !== 'Identifier' ||
        p.value.type !== 'Identifier'
      ) {
        return undefined
      }

      return findMatchingComponent(
        p.key.name,
        p.value.name,
        imports,
        localPathToUri
      )
    })
    .filter(<T>(p: T | undefined): p is T => p !== undefined)
}

function extractLazyAddComponents(
  prop: AST.ObjectProperty | AST.ObjectMethod,
  imports: Record<string, AST.ImportDeclaration>,
  localPathToUri: (localPath: string) => string
): ChildComponent[] {
  const func = normalizeMethod(prop)
  if (!func || func.body.type !== 'BlockStatement') {
    return []
  }

  // Extract all `this.$options.components.LocalComponentName = ComponentName`
  return func.body.body
    .map((st): ChildComponent | undefined => {
      // We leave this chack as loosely since the user may not write
      // `this.$options.components.LocalComponentName = ComponentName`
      // but assign `components` to another variable to save key types.
      // If there are false positive in this check, they probably be
      // proned by maching with imported components in later.
      if (
        st.type !== 'ExpressionStatement' ||
        st.expression.type !== 'AssignmentExpression' ||
        st.expression.right.type !== 'Identifier' || // = ComponentName
        st.expression.left.type !== 'MemberExpression' ||
        st.expression.left.property.type !== 'Identifier' // .LocalComponentName
      ) {
        return undefined
      }

      return findMatchingComponent(
        st.expression.right.name,
        st.expression.left.property.name,
        imports,
        localPathToUri
      )
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

function findMatchingComponent(
  localName: string,
  importedName: string,
  imports: Record<string, AST.ImportDeclaration>,
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
 * Find a property name that matches the specified property name.
 */
function findProperty(
  props: (AST.ObjectProperty | AST.ObjectMethod | AST.SpreadProperty)[],
  name: string
): AST.ObjectProperty | AST.ObjectMethod | undefined {
  return props.filter(isStaticProperty).find(p => {
    return (p.key as AST.Identifier).name === name
  })
}

/**
 * Return function-like node if object property has
 * function value or it is a method.
 * Return undefined if it does not have a function value.
 */
function normalizeMethod(
  prop: AST.ObjectProperty | AST.ObjectMethod
): AST.Function | undefined {
  if (prop.type === 'ObjectMethod') {
    return prop
  }
  if (
    prop.value.type === 'FunctionExpression' ||
    prop.value.type === 'ArrowFunctionExpression'
  ) {
    return prop.value
  }
  return undefined
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
    const type = findProperty(value.properties, 'type')

    if (type && type.value && type.value.type === 'Identifier') {
      return type.value.name
    }
  }

  return 'any'
}

function getPropDefault(value: AST.Expression | AST.Pattern): DefaultValue {
  if (value.type === 'ObjectExpression') {
    // Find `default` property in the prop option.
    const def = findProperty(value.properties, 'default')

    if (def) {
      // If it is a function, extract default value from it,
      // otherwise just use the value.
      const func = normalizeMethod(def)
      if (func) {
        const exp = getReturnedExpression(func.body)
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
  // If the value is an object expression, just return it.
  if (prop.type === 'ObjectProperty') {
    const value = prop.value
    if (value.type === 'ObjectExpression') {
      return value
    }
  }

  // If the value is a function, return the returned object expression
  const func = normalizeMethod(prop)
  if (func) {
    const exp = getReturnedExpression(func.body)
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
