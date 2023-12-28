import { name as validateName } from 'xml-name-validator'
import {
  TEDirective,
  TEChild,
  TEForDirective,
  TEElement,
  TEStartTag,
} from '../../parser/template/types'
import { DefaultValue } from '../../parser/script/types'
import { evalWithScope } from '../eval'
import { isObject, range, mapValues } from '../../utils'
import { VNode } from 'vue'

function directiveValue(
  dir: TEDirective,
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
  stack: TEElement[]
): boolean {
  function loop(
    acc: boolean,
    scope: Record<string, DefaultValue>,
    stack: TEElement[]
  ): boolean {
    const last = stack[stack.length - 1]
    if (!last) {
      return acc
    }

    const lastVIf = last.startTag.directives.find(
      (dir) => dir.name === 'if' || dir.name === 'else-if'
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
  el: TEChild
  scope: Record<string, DefaultValue>
}

export interface ResolvedSlot {
  scopeName: string | undefined
  contents: TEChild[]
}

function resolveVFor(
  acc: ResolvedChild[],
  vFor: TEForDirective,
  el: TEElement,
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
            scope: newScope,
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
  vIf: TEDirective,
  el: TEElement,
  scope: Record<string, DefaultValue>
): ResolvedChild[] {
  return directiveValue(vIf, scope)
    ? acc.concat(unwrapTemplate(el, scope))
    : acc
}

function resolveVElse(
  acc: ResolvedChild[],
  vElse: TEDirective,
  el: TEElement,
  scope: Record<string, DefaultValue>
): ResolvedChild[] {
  const isElement = (node: TEChild): node is TEElement => {
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

export function resolveSlots(el: TEElement): Record<string, ResolvedSlot> {
  let slots: Record<string, ResolvedSlot> = {}

  el.children.forEach((child) => {
    if (child.type !== 'Element') {
      if (slots.default) {
        slots.default.contents.push(child)
      } else {
        slots.default = {
          scopeName: undefined,
          contents: [child],
        }
      }
      return
    }

    const attrs = child.startTag.attrs
    const slotScope = attrs['slot-scope']
    const slotScopeName = slotScope?.value
    const slotName = attrs.slot?.value ?? 'default'

    const contents =
      (attrs.slot || slotScope) && child.name === 'template'
        ? child.children
        : [child]

    slots[slotName] = {
      scopeName: slotScopeName ?? slots[slotName]?.scopeName,
      contents: slots[slotName]
        ? slots[slotName].contents.concat(contents)
        : contents,
    }
  })

  return slots
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
    const vFor = dirs.find((d): d is TEForDirective => d.name === 'for')
    if (!iteratingByVFor && vFor) {
      return resolveVFor(acc, vFor, child, scope)
    }

    // v-if
    const vIf = dirs.find((d) => d.name === 'if')
    if (vIf) {
      return resolveVIf(acc, vIf, child, scope)
    }

    // v-else or v-else-if
    const vElse = dirs.find((d) => {
      return d.name === 'else' || d.name === 'else-if'
    })
    if (vElse) {
      return resolveVElse(acc, vElse, child, scope)
    }
  }

  return acc.concat(item)
}

function unwrapTemplate(
  el: TEElement,
  scope: Record<string, DefaultValue>
): ResolvedChild[] {
  if (el.name !== 'template') {
    return [
      {
        el,
        scope,
      },
    ]
  }

  return el.children.map((child) => ({
    el: child,
    scope,
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

  cssText.split(listDelimiter).forEach(function (item) {
    if (item) {
      const tmp = item.split(propertyDelimiter)
      if (tmp.length > 1) {
        res[tmp[0].trim()] = tmp[1].trim()
      }
    }
  })

  return res
}

export function convertToSlotScope(
  startTag: TEStartTag,
  scope: Record<string, DefaultValue>
): Record<string, DefaultValue> {
  return {
    ...mapValues(startTag.attrs, (attr) => attr.value),
    ...mapValues(startTag.props, (prop) => directiveValue(prop, scope)),
  }
}

export function convertToVNodeProps(
  startTag: TEStartTag,
  scope: Record<string, DefaultValue>
): Record<string, any> {
  const { attrs, props, domProps, directives } = startTag
  const vnodeProps: Record<string, any> = {
    class: [],
    style: [],
  }

  Object.keys(attrs).forEach((key) => {
    const attr = attrs[key]
    if (attr.name === 'class') {
      vnodeProps.class = [...vnodeProps.class, attr.value ?? '']
    } else if (attr.name === 'style') {
      vnodeProps.style = [...vnodeProps.style, parseStyleText(attr.value || '')]
    } else if (attr.name === 'slot') {
      // Skip
      // Slot is handled in VNode children
    } else if (isValidAttributeName(attr.name)) {
      vnodeProps[attr.name] = attr.value || ''
    }
  })

  Object.keys(props).forEach((key) => {
    const prop = props[key]
    const value = directiveValue(prop, scope)
    if (prop.argument === 'class') {
      vnodeProps.class = [...vnodeProps.class, value]
    } else if (prop.argument === 'style') {
      vnodeProps.style = [...vnodeProps.style, value]
    } else if (isValidAttributeName(prop.argument!)) {
      // We need to assign the value into `attrs` here
      // to simulate vue-template-compiler.
      vnodeProps[prop.argument!] = value
    }
  })

  Object.keys(domProps).forEach((key) => {
    const value = directiveValue(domProps[key], scope)
    vnodeProps[key] = value
  })

  directives.forEach((dir) => {
    const value = directiveValue(dir, scope)
    if (dir.name === 'text') {
      vnodeProps.textContent = value
    } else if (dir.name === 'html') {
      vnodeProps.innerHTML = value
    } else if (dir.name === 'show') {
      vnodeProps.style = [
        ...vnodeProps.style,
        value ? undefined : { display: 'none' },
      ]
    }
  })

  return vnodeProps
}

export function resolveDirectives(
  vnode: VNode,
  startTag: TEStartTag,
  scope: Record<string, DefaultValue>
): VNode {
  return startTag.directives.reduce((vnode, dir) => {
    if (dir.name === 'model') {
      resolveVModel(vnode, directiveValue(dir, scope))
      return vnode
    }

    return vnode
  }, vnode)
}

function resolveVModel(vnode: VNode, modelValue: any): void {
  const vnodeProps = vnode.props ?? (vnode.props = {})
  if (vnode.type === 'input') {
    const type = vnodeProps.type
    if (type === 'checkbox') {
      if (typeof modelValue === 'boolean') {
        vnodeProps.checked = modelValue
      } else if (Array.isArray(modelValue)) {
        const valueValue = vnodeProps.value
        vnodeProps.checked = modelValue.indexOf(valueValue) >= 0
      }
      return
    }

    if (type === 'radio') {
      const valueValue = vnodeProps.value
      vnodeProps.checked = valueValue === modelValue
      return
    }
  }

  vnodeProps.value = modelValue
}

function isValidAttributeName(name: string): boolean {
  return validateName(name)
}
