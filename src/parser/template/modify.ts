import { TETemplate, TETextNode, TEChild, TEElement } from './types'
import { getNode } from './manipulate'
import {
  insertBefore,
  singleIndentStr,
  insertAfter,
  Modifier,
  empty
} from '../modifier'

export function insertToTemplate(
  template: TETemplate,
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

  const parent = getNode(template, parentPath) as TEElement | undefined
  if (parent) {
    const pre = '\n' + indent + singleIndentStr
    const post = '\n' + indent
    return insertAfter(parent.startTag, pre + value + post)
  }

  return empty
}

function inferTemplateIndentAt(template: TETemplate, path: number[]): string {
  if (path.length === 0) {
    return ''
  }

  const parentPath = path.slice(0, -1)

  let node: TETextNode | undefined, iterating: TEChild | undefined
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
