import * as t from 'babel-types'
import { flatten } from '../utils'
import { Template, getNode, TextNode, ElementChild, Element } from './template'
import { findComponentOptions, ChildComponent, findProperty } from './script'

export type Modifiers = (Modifier | Modifier[])[]

export type Modifier = Add | Remove

export interface Range {
  range: [number, number]
}

interface Add {
  type: 'Add'
  pos: number
  value: string
}

interface Remove {
  type: 'Remove'
  pos: number
  length: number
}

const empty = insertAt(0, '')
const singleIndentStr = '  '

export function modify(code: string, modfiers: Modifiers): string {
  const ms = flatten(modfiers).sort(modifierComperator)

  function loop(
    acc: string,
    pos: number,
    cur: Modifier | undefined,
    rest: Modifier[]
  ): string {
    if (!cur) {
      return acc + code.slice(pos)
    }

    // Fix the current position to resolve overwraps of nodes.
    // e.g.
    //  remove: [4, 8] -> insert: 6
    //  then insert position will be 8.
    const fixedPos = pos <= cur.pos ? cur.pos : pos
    const pre = code.slice(pos, fixedPos)
    switch (cur.type) {
      case 'Add':
        return loop(acc + pre + cur.value, fixedPos, rest[0], rest.slice(1))
      case 'Remove':
        const endPos = cur.pos + cur.length
        const fixedEnd = pos <= endPos ? endPos : pos
        return loop(acc + pre, fixedEnd, rest[0], rest.slice(1))
      default:
        throw new Error(
          '[modifier] Unexpected modifier type: ' + (cur as any).type
        )
    }
  }
  return loop('', 0, ms[0], ms.slice(1))
}

function modifierComperator(a: Modifier, b: Modifier): number {
  if (a.pos < b.pos) {
    return -1
  } else if (a.pos > b.pos) {
    return 1
  } else {
    return 0
  }
}

export function insertAt(pos: number, value: string): Modifier {
  return {
    type: 'Add',
    pos,
    value
  }
}

export function insertBefore(node: Range, value: string): Modifier {
  return insertAt(node.range[0], value)
}

export function insertAfter(node: Range, value: string): Modifier {
  return insertAt(node.range[1], value)
}

export function remove(node: Range): Modifier {
  return {
    type: 'Remove',
    pos: node.range[0],
    length: node.range[1] - node.range[0]
  }
}

export function replace(node: Range, value: string): Modifier[] {
  return [remove(node), insertAfter(node, value)]
}

export function insertToTemplate(
  template: Template,
  path: number[],
  value: string
): Modifier {
  const parentPath = path.slice(0, -1)
  const indent = inferTemplateIndentAt(template, parentPath)
  const target = getNode(template, path)
  if (target) {
    // If target path points an existing node, we can insert a new string before it.
    const post = '\n' + indent + singleIndentStr
    return insertBefore(target, value + post)
  }

  const index = path[path.length - 1]
  const last = getNode(template, parentPath.concat(index - 1))
  if (last) {
    // If target path points nothing, it indicates we will insert a new string
    // as the last element. If the current last node has indentation, we need
    // to add an extra indentation to align the children nodes and inserted one.
    //
    // ```
    // <div>
    //   <h1>Test</h1>
    // </div>
    // ```
    //
    // In the above case, the end tag has two spaces. If we want to insert a node
    // as the last child of `<div>` element, we will reuse the last text (indentation)
    // and add two spaces for indentation.
    //
    // ```
    // <div>
    //   <h1>Test</h1>
    //   <p>Hello</p>
    // </div>
    // ```
    //
    // But we should not add extra spaces if the end tag has no indentation. For example:
    //
    // ```
    // <div><strong>Test</strong></div>
    // ```
    //
    // In that case, we simply add a line break and appropriate indentation like:
    //
    // ```
    // <div><strong>Test</strong>
    //   <p>Hello</p>
    // </div>
    // ```
    const hasIndent = last.type === 'TextNode' && last.text.endsWith(indent)
    const pre = (hasIndent ? '' : '\n' + indent) + singleIndentStr
    const post = '\n' + indent
    return insertAfter(last, pre + value + post)
  }

  const parent = getNode(template, parentPath) as Element | undefined
  if (parent) {
    const pre = '\n' + indent + singleIndentStr
    const post = '\n' + indent
    return insertAfter(parent.startTag, pre + value + post)
  }

  return empty
}

export function insertComponentScript(
  ast: t.Program,
  code: string,
  component: ChildComponent
): Modifier[] {
  const options = findComponentOptions(ast.body)
  if (!options) return []

  const componentOptions = findProperty(options.properties, 'components')
  if (!componentOptions) {
    return [
      insertComponentImport(ast, code, component),
      insertComponentOptions(options, code, component)
    ]
  }

  const value = componentOptions.value
  if (!t.isObjectExpression(value)) return []

  return [
    insertComponentImport(ast, code, component),
    insertComponentOptionItem(value, code, component)
  ]
}

function insertComponentImport(
  ast: t.Program,
  code: string,
  component: ChildComponent
): Modifier {
  const imports = ast.body.filter(el => t.isImportDeclaration(el))
  const lastImport = imports[imports.length - 1]
  const indent = inferScriptIndent(code, lastImport || ast)
  const insertedCode =
    '\n' + indent + `import ${component.name} from '${component.uri}'`

  if (lastImport) {
    return insertAfter(lastImport as any, insertedCode)
  } else {
    return insertAt(ast as any, insertedCode)
  }
}

function insertComponentOptions(
  options: t.ObjectExpression,
  code: string,
  component: ChildComponent
): Modifier {
  const indent = inferScriptIndent(code, options) + singleIndentStr
  const pos = (options as any).range[0]
  const comma = options.properties.length > 0 ? ',' : ''

  // prettier-ignore
  const value = [
    '',
    indent + 'components: {',
    indent + singleIndentStr + component.name,
    indent + '}' + comma,
    ''
  ].join('\n')

  return insertAt(pos + 1, value)
}

function insertComponentOptionItem(
  componentOptions: t.ObjectExpression,
  code: string,
  component: ChildComponent
): Modifier {
  const indent = inferScriptIndent(code, componentOptions) + singleIndentStr
  const range = (componentOptions as any).range
  const shouldAddComma = !/[{,]\s*\}$/.test(code.slice(range[0], range[1]))
  const comma = shouldAddComma ? ',' : ''

  const properties = componentOptions.properties
  const lastProperty = properties[properties.length - 1]

  const insertedCode = comma + '\n' + indent + component.name

  if (lastProperty) {
    return insertAfter(lastProperty as any, insertedCode)
  } else {
    return insertAt(range[0] + 1, insertedCode)
  }
}

function inferTemplateIndentAt(template: Template, path: number[]): string {
  if (path.length === 0) {
    return ''
  }

  const parentPath = path.slice(0, -1)

  let node: TextNode | undefined, iterating: ElementChild | undefined
  for (let i = 0; (iterating = getNode(template, parentPath.concat(i))); i++) {
    if (iterating.type === 'TextNode') {
      node = iterating
      break
    }
  }

  if (!node) {
    return inferTemplateIndentAt(template, parentPath) + singleIndentStr
  }

  const match = /\n(\s+)/.exec(node.text)
  if (!match) {
    return ''
  }
  return match[1]
}

function inferScriptIndent(code: string, node: t.Node): string {
  const pre = code.slice(0, (node as any).range[1])
  const match = /[\^\n]([\t ]+).*$/.exec(pre)
  if (match) {
    return match[1]
  } else {
    return ''
  }
}
