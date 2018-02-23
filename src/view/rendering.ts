import { VNodeData } from 'vue'
import {
  Directive,
  Attribute,
  ElementChild,
  VForDirective,
  Element
} from '@/parser/template'
import { DefaultValue } from '@/parser/script'
import { evalWithScope } from './eval'
import { isObject, range, clone } from '@/utils'

function findDirective(
  attrs: (Attribute | Directive)[],
  fn: (directive: Directive) => boolean
): Directive | undefined {
  return attrs.find((attr): attr is Directive => {
    return attr.directive && fn(attr)
  })
}

function directiveValue(
  dir: Directive,
  scope: Record<string, DefaultValue>
): DefaultValue {
  const exp = dir.expression
  if (exp === null) {
    return undefined
  }

  const result = evalWithScope(exp, scope)
  if (result.isSuccess) {
    return result.value
  } else {
    return undefined
  }
}

function shouldAppearVElse(
  scope: Record<string, DefaultValue>,
  stack: Element[]
): boolean {
  function loop(
    acc: boolean,
    scope: Record<string, DefaultValue>,
    stack: Element[]
  ): boolean {
    const last = stack[stack.length - 1]
    if (!last) {
      return acc
    }

    const lastVIf = findDirective(
      last.startTag.attributes,
      dir => dir.name === 'if' || dir.name === 'else-if'
    )

    if (!lastVIf) {
      return acc
    }

    const appearPrev = directiveValue(lastVIf, scope)
    const appearElse = acc && !appearPrev
    if (lastVIf.name === 'if') {
      return appearElse
    } else {
      return loop(appearElse, scope, stack.slice(0, -1))
    }
  }
  return loop(true, scope, stack)
}

export interface ResolvedChild {
  el: ElementChild
  scope: Record<string, DefaultValue>
}

/**
 * Resolve v-if/-else/-else-if and v-for,
 * so that add or remove AST node from final output.
 */
export function resolveControlDirectives(
  acc: ResolvedChild[],
  item: ResolvedChild
): ResolvedChild[] {
  const { el: child, scope } = item
  if (child.type === 'Element') {
    const attrs = child.startTag.attributes

    // v-for
    const vFor = findDirective(attrs, d => d.name === 'for') as
      | VForDirective
      | undefined
    if (vFor) {
      // Remove if v-for expression is invalid or iteratee type looks cannot iterate.
      const iteratee = vFor.right && evalWithScope(vFor.right, scope)
      const isValidIteratee = (value: any) => {
        return isObject(value) || typeof value === 'number'
      }
      if (
        !iteratee ||
        !iteratee.isSuccess ||
        !isValidIteratee(iteratee.value)
      ) {
        return acc
      }

      const vForIndex = attrs.indexOf(vFor)
      const cloneNode = clone(child, {
        startTag: clone(child.startTag, {
          // Need to remove v-for directive to avoid infinite loop.
          attributes: [
            ...attrs.slice(0, vForIndex),
            ...attrs.slice(vForIndex + 1)
          ]
        })
      })
      return reduceVFor(
        iteratee.value,
        (acc, ...iteraterValues: any[]) => {
          const newScope = { ...scope }
          vFor.left.forEach((name, i) => {
            newScope[name] = iteraterValues[i]
          })
          return resolveControlDirectives(acc, {
            el: cloneNode,
            scope: newScope
          })
        },
        acc
      )
    }

    // v-if
    const vIf = findDirective(attrs, d => d.name === 'if')
    if (vIf) {
      return directiveValue(vIf, scope) ? acc.concat(item) : acc
    }

    // v-else or v-else-if
    const vElse = findDirective(attrs, d => {
      return d.name === 'else' || d.name === 'else-if'
    })
    if (vElse) {
      const isElement = (node: ElementChild): node is Element => {
        return node.type === 'Element'
      }
      const elements = acc.map(({ el }) => el).filter(isElement)

      if (!shouldAppearVElse(scope, elements)) {
        return acc
      }

      if (vElse.name === 'else') {
        return acc.concat(item)
      }

      return directiveValue(vElse, scope) ? acc.concat(item) : acc
    }
  }

  return acc.concat(item)
}

/**
 * Helper function to handle v-for iteration.
 */
function reduceVFor<T, U>(
  value: number | Record<string, T> | T[],
  fn: (acc: U, ...args: any[]) => U,
  initial: U
): U {
  if (typeof value === 'number') {
    // Range
    return range(1, value).reduce((acc, i) => {
      return fn(acc, i)
    }, initial)
  } else if (Array.isArray(value)) {
    // Array
    return value.reduce((acc, item, index) => {
      return fn(acc, item, index)
    }, initial)
  } else {
    // Object
    return Object.keys(value).reduce((acc, key, index) => {
      return fn(acc, value[key], key, index)
    }, initial)
  }
}

// Borrowed from Vue.js style parser
function parseStyleText(cssText: string): Record<string, string> {
  const res: Record<string, string> = {}
  const listDelimiter = /;(?![^(]*\))/g
  const propertyDelimiter = /:(.+)/

  cssText.split(listDelimiter).forEach(function(item) {
    if (item) {
      const tmp = item.split(propertyDelimiter)
      tmp.length > 1 && (res[tmp[0].trim()] = tmp[1].trim())
    }
  })

  return res
}

export function convertToVNodeData(
  attrs: (Attribute | Directive)[],
  scope: Record<string, DefaultValue>
): VNodeData {
  const initial: VNodeData = {
    attrs: {},
    domProps: {},
    class: [],
    directives: []
  }

  return attrs.reduce((acc, attr) => {
    // Normal attribute
    if (!attr.directive) {
      if (attr.name === 'class') {
        acc.staticClass = attr.value || undefined
      } else if (attr.name === 'style') {
        acc.staticStyle = parseStyleText(attr.value || '')
      } else {
        acc.attrs![attr.name] = attr.value || ''
      }
      return acc
    }

    // Directive
    const value = directiveValue(attr, scope)
    if (attr.name === 'bind' && attr.argument) {
      if (attr.argument === 'class') {
        acc.class.push(value)
      } else if (attr.argument === 'style') {
        acc.style = value as any
      } else {
        acc.attrs![attr.argument] = value
      }
    } else if (attr.name === 'model') {
      acc.attrs!.value = value
    } else if (attr.name === 'text') {
      acc.domProps!.textContent = value
    } else if (attr.name === 'html') {
      acc.domProps!.innerHTML = value
    } else if (attr.name === 'show') {
      const modifierMap: Record<string, boolean> = {}
      attr.modifiers.forEach(modifier => {
        modifierMap[modifier] = true
      })

      acc.directives!.push({
        name: 'show',
        expression: attr.expression,
        oldValue: undefined,
        arg: attr.argument || '',
        modifiers: modifierMap,
        value
      })
    }
    return acc
  }, initial)
}
