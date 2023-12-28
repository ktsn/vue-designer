import assert from 'assert'
import * as t from '@babel/types'
import { findComponentOptions, findProperty } from './manipulate'
import { Modifier, singleIndentStr, insertAt } from '../modifier'

export function insertComponentScript(
  ast: t.Program,
  code: string,
  componentName: string,
  componentPath: string,
): Modifier[] {
  const options = findComponentOptions(ast.body)
  if (!options) return []

  const componentOptions = findProperty(options.properties, 'components')
  if (!componentOptions) {
    return [
      insertComponentImport(ast, code, componentName, componentPath),
      insertComponentOptions(options, code, componentName),
    ]
  }

  const value = componentOptions.value
  if (!t.isObjectExpression(value)) return []

  return [
    insertComponentImport(ast, code, componentName, componentPath),
    insertComponentOptionItem(value, code, componentName),
  ]
}

function insertComponentImport(
  ast: t.Program,
  code: string,
  componentName: string,
  componentPath: string,
): Modifier {
  assert(
    ast.body[0],
    '[modifier] script block should have at least one statement.',
  )

  const imports = ast.body.filter((el) => t.isImportDeclaration(el))
  const lastImport = imports[imports.length - 1]

  const indent = inferScriptIndent(code, lastImport || ast.body[0])
  const insertedCode = `import ${componentName} from '${componentPath}'`

  if (lastImport) {
    return insertAt(lastImport.end!, '\n' + indent + insertedCode)
  } else {
    return insertAt(ast.body[0].start!, insertedCode + '\n' + indent)
  }
}

function insertComponentOptions(
  options: t.ObjectExpression,
  code: string,
  componentName: string,
): Modifier {
  const indent = inferScriptIndent(code, options) + singleIndentStr
  const comma = options.properties.length > 0 ? ',' : ''

  // prettier-ignore
  const value = [
    '',
    indent + 'components: {',
    indent + singleIndentStr + componentName,
    indent + '}' + comma,
    ''
  ].join('\n')

  return insertAt(options.start! + 1, value)
}

function insertComponentOptionItem(
  componentOptions: t.ObjectExpression,
  code: string,
  componentName: string,
): Modifier {
  const indent = inferScriptIndent(code, componentOptions) + singleIndentStr
  const { start, end } = componentOptions
  const shouldAddComma = !/\{\s*\}$/.test(code.slice(start!, end!))
  const comma = shouldAddComma ? ',' : ''

  const properties = componentOptions.properties
  const lastProperty = properties[properties.length - 1]

  const insertedCode = comma + '\n' + indent + componentName

  if (lastProperty) {
    return insertAt(lastProperty.end!, insertedCode)
  } else {
    return insertAt(start! + 1, insertedCode)
  }
}

function inferScriptIndent(code: string, node: t.Node): string {
  const pre = code.slice(0, node.end!)
  const match = /[\^\n]([\t ]+).*$/.exec(pre)
  if (match) {
    return match[1]
  } else {
    return ''
  }
}
