import { VNodeData } from 'vue'
import { name as validateName } from 'xml-name-validator'
import {
  Directive,
  Attribute,
  ElementChild,
  VForDirective,
  Element
} from '@/parser/template/types'
import { DefaultValue } from '@/parser/script/types'
import { evalWithScope } from './eval'
import { isObject, range, mapValues } from '@/utils'

function directiveValue(
  dir: Directive,
  scope: Record<string, DefaultValue>
): DefaultValue {
  const exp = dir.expression
  if (exp === undefined) {
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

    const lastVIf = last.startTag.directives.find(
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

export interface ResolvedScopedSlot {
  scopeName: string
  contents: ElementChild[]
}

function resolveVFor(
  acc: ResolvedChild[],
  vFor: VForDirective,
  el: Element,
  scope: Record<string, DefaultValue>
): ResolvedChild[] {
  // Remove if v-for expression is invalid or iteratee type looks cannot iterate.
  const iteratee = vFor.right && evalWithScope(vFor.right, scope)
  const isValidIteratee = (value: any) => {
    return isObject(value) || typeof value === 'number'
  }
  if (!iteratee || !iteratee.isSuccess || !isValidIteratee(iteratee.value)) {
    return acc
  }

  const unwrapped = el.name === 'template' ? el.children : [el]

  return reduceVFor(
    iteratee.value,
    (acc, ...iteraterValues: any[]) => {
      const newScope = { ...scope }
      vFor.left.forEach((name, i) => {
        newScope[name] = iteraterValues[i]
      })
      return unwrapped.reduce((acc, node) => {
        return resolveControlDirectives(
          acc,
          {
            el: node,
            scope: newScope
          },
          true
        )
      }, acc)
    },
    acc
  )
}

function resolveVIf(
  acc: ResolvedChild[],
  vIf: Directive,
  el: Element,
  scope: Record<string, DefaultValue>
): ResolvedChild[] {
  return directiveValue(vIf, scope)
    ? acc.concat(unwrapTemplate(el, scope))
    : acc
}

function resolveVElse(
  acc: ResolvedChild[],
  vElse: Directive,
  el: Element,
  scope: Record<string, DefaultValue>
): ResolvedChild[] {
  const isElement = (node: ElementChild): node is Element => {
    return node.type === 'Element'
  }
  const elements = acc.map(({ el }) => el).filter(isElement)

  if (!shouldAppearVElse(scope, elements)) {
    return acc
  }

  if (vElse.name === 'else') {
    // v-else
    return acc.concat(unwrapTemplate(el, scope))
  } else {
    // v-else-if
    return resolveVIf(acc, vElse, el, scope)
  }
}

export function resolveScopedSlots(
  el: Element
): Record<string, ResolvedScopedSlot> | undefined {
  let scopedSlots: Record<string, ResolvedScopedSlot> | undefined

  el.children.forEach(child => {
    if (child.type !== 'Element') return

    const attrs = child.startTag.attrs

    const slotScope = attrs['slot-scope']
    const slotScopeName = slotScope && slotScope.value
    if (!slotScopeName) return

    const slot = attrs.slot
    const slotName = (slot && slot.value) || 'default'

    const contents = child.name === 'template' ? child.children : [child]

    if (!scopedSlots) {
      scopedSlots = {}
    }

    scopedSlots[slotName] = {
      scopeName: slotScopeName,
      contents
    }
  })

  return scopedSlots
}

/**
 * Resolve v-if/-else/-else-if and v-for,
 * so that add or remove AST node from final output.
 */
export function resolveControlDirectives(
  acc: ResolvedChild[],
  item: ResolvedChild,
  iteratingByVFor: boolean = false
): ResolvedChild[] {
  const { el: child, scope } = item
  if (child.type === 'Element') {
    const dirs = child.startTag.directives

    // v-for
    const vFor = dirs.find((d): d is VForDirective => d.name === 'for')
    if (!iteratingByVFor && vFor) {
      return resolveVFor(acc, vFor, child, scope)
    }

    // v-if
    const vIf = dirs.find(d => d.name === 'if')
    if (vIf) {
      return resolveVIf(acc, vIf, child, scope)
    }

    // v-else or v-else-if
    const vElse = dirs.find(d => {
      return d.name === 'else' || d.name === 'else-if'
    })
    if (vElse) {
      return resolveVElse(acc, vElse, child, scope)
    }
  }

  return acc.concat(item)
}

function unwrapTemplate(
  el: Element,
  scope: Record<string, DefaultValue>
): ResolvedChild[] {
  if (el.name !== 'template') {
    return [
      {
        el,
        scope
      }
    ]
  }

  return el.children.map(child => ({
    el: child,
    scope
  }))
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

export function convertToSlotScope(
  attrs: Record<string, Attribute>,
  dirs: Directive[],
  scope: Record<string, DefaultValue>
): Record<string, DefaultValue> {
  const slotScope: Record<string, any> = mapValues(attrs, attr => attr.value)
  dirs.forEach(attr => {
    if (attr.name === 'bind' && attr.argument) {
      slotScope[attr.argument] = directiveValue(attr, scope)
    }
  })
  return slotScope
}

export function convertToVNodeData(
  tag: string,
  attributes: Record<string, Attribute>,
  directives: Directive[],
  scope: Record<string, DefaultValue>
): VNodeData {
  const initial: VNodeData = {
    attrs: {},
    domProps: {},
    class: [],
    directives: []
  }

  const data = Object.keys(attributes).reduce((acc, key) => {
    const attr = attributes[key]
    if (attr.name === 'class') {
      acc.staticClass = attr.value || undefined
    } else if (attr.name === 'style') {
      acc.staticStyle = parseStyleText(attr.value || '')
    } else if (attr.name === 'slot') {
      acc.slot = attr.value || undefined
    } else if (isValidAttributeName(attr.name)) {
      acc.attrs![attr.name] = attr.value || ''
    }
    return acc
  }, initial)

  return directives.reduce((acc, dir) => {
    const value = directiveValue(dir, scope)
    if (dir.name === 'bind' && dir.argument) {
      if (dir.argument === 'class') {
        acc.class.push(value)
      } else if (dir.argument === 'style') {
        acc.style = value as any
      } else if (isValidAttributeName(dir.argument)) {
        acc.attrs![dir.argument] = value
      }
    } else if (dir.name === 'model') {
      resolveVModel(acc, tag, attributes, value)
    } else if (dir.name === 'text') {
      acc.domProps!.textContent = value
    } else if (dir.name === 'html') {
      acc.domProps!.innerHTML = value
    } else if (dir.name === 'show') {
      acc.directives!.push({
        name: 'show',
        expression: dir.expression,
        oldValue: undefined,
        arg: dir.argument || '',
        modifiers: dir.modifiers,
        value
      })
    }
    return acc
  }, data)
}

function resolveVModel(
  data: VNodeData,
  tag: string,
  attrs: Record<string, Attribute>,
  value: any
): void {
  if (tag === 'input') {
    const type = attrs.type
    if (type) {
      if (type.value === 'checkbox') {
        if (typeof value === 'boolean') {
          data.domProps!.checked = value
        } else if (Array.isArray(value)) {
          const valueAttr = attrs.value
          if (valueAttr) {
            data.domProps!.checked = value.indexOf(valueAttr.value) >= 0
          }
        }
        return
      }

      if (type.value === 'radio') {
        const valueAttr = attrs.value
        if (valueAttr) {
          data.domProps!.checked = valueAttr.value === value
        }
        return
      }
    }
  } else if (tag === 'select') {
    // Utilize Vue's v-model directive to sync <select> value
    data.directives!.push({
      name: 'model',
      value
    } as any)
  }
  data.attrs!.value = value
}

function isValidAttributeName(name: string): boolean {
  return validateName(name).success
}
