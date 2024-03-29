import * as t from './types'
import { scopePrefix } from '../style/manipulate'
import { AssetResolver } from '../../asset-resolver'
import { assert, clone } from '../../utils'

export function getNode(
  root: t.TETemplate,
  path: number[],
): t.TEChild | undefined {
  function loop(current: t.TEChild, rest: number[]): t.TEChild | undefined {
    // If `rest` does not have any items,
    // `current` is the node we are looking for.
    if (rest.length === 0) {
      return current
    }

    // The current node does not have children,
    // then we cannot traverse any more.
    if (current.type !== 'Element') {
      return undefined
    }

    const next = current.children[rest[0]]
    if (!next) {
      return undefined
    } else {
      return loop(next, rest.slice(1))
    }
  }
  const [index, ...rest] = path
  const el = root.children[index]
  return el && loop(el, rest)
}

export function insertNode(
  root: t.TETemplate,
  path: number[],
  el: t.TEChild,
): t.TETemplate {
  function loop<T extends t.TEElement | t.TETemplate>(
    parent: T,
    index: number,
    rest: number[],
  ): T {
    assert(index != null, '[template] index should not be null or undefined')

    const cs = parent.children

    // If `rest` is empty, insert the node to `index`
    if (rest.length === 0) {
      assert(
        0 <= index && index <= cs.length,
        "[template] cannot insert the node to '" +
          path.join('->') +
          "' as the last index is out of possible range: " +
          `0 <= ${index} <= ${cs.length}`,
      )

      return clone(parent, {
        children: [...cs.slice(0, index), el, ...cs.slice(index)],
      })
    }

    const child = parent.children[index] as t.TEElement
    assert(
      child,
      "[template] cannot reach to the path '" +
        path.join('->') +
        "' as there is no node on the way",
    )
    assert(
      child.type === 'Element',
      "[template] cannot reach to the path '" +
        path.join('->') +
        "' as there is text or expression node on the way",
    )

    const [head, ...tail] = rest
    return clone(parent, {
      children: [
        ...cs.slice(0, index),
        loop(child, head, tail),
        ...cs.slice(index + 1),
      ],
    })
  }
  return loop(root, path[0], path.slice(1))
}

export function visitElements(
  node: t.TETemplate,
  fn: (el: t.TEElement) => t.TEElement | void,
): t.TETemplate {
  function loop(node: t.TEChild): t.TEChild {
    switch (node.type) {
      case 'Element':
        const newNode = clone(node, {
          children: node.children.map(loop),
        })
        return fn(newNode) || newNode
      default:
        // Do nothing
        return node
    }
  }
  return clone(node, {
    children: node.children.map(loop),
  })
}

export function resolveAsset(
  template: t.TETemplate,
  baseUrl: string,
  resolver: AssetResolver,
): t.TETemplate {
  return visitElements(template, (el) => {
    const src = el.startTag.attrs.src
    if (el.name === 'img' && src && src.value) {
      const resolvedSrc = clone(src, {
        value: resolver.pathToUrl(src.value, baseUrl),
      })

      return clone(el, {
        startTag: clone(el.startTag, {
          attrs: clone(el.startTag.attrs, {
            src: resolvedSrc,
          }),
        }),
      })
    }
  })
}

export function addScope(node: t.TETemplate, scope: string): t.TETemplate {
  const scopeName = scopePrefix + scope

  return visitElements(node, (el) => {
    return clone(el, {
      startTag: clone(el.startTag, {
        attrs: clone(el.startTag.attrs, {
          [scopeName]: {
            type: 'Attribute',
            attrIndex: -1,
            name: scopeName,
            range: [-1, -1],
          },
        }),
      }),
    })
  })
}
