<script lang="ts">
import Vue, { VNode, VNodeData, VNodeDirective } from 'vue'
import Child from './Child.vue'
import {
  Element,
  Attribute,
  Directive,
  ElementChild
} from '../../parser/template'
import { DefaultValue } from '../../parser/script'

function findDirective(
  attrs: (Attribute | Directive)[],
  fn: (directive: Directive) => boolean
): Directive | undefined {
  return attrs.find((attr): attr is Directive => {
    return attr.directive && fn(attr)
  })
}

function inScope(
  exp: string | null,
  scope: Record<string, DefaultValue>
): exp is string {
  return Boolean(exp && exp in scope)
}

function directiveValue(
  dir: Directive,
  scope: Record<string, DefaultValue>
): DefaultValue {
  const exp = dir.expression

  if (dir.value !== undefined) {
    return dir.value
  } else if (inScope(exp, scope)) {
    return scope[exp]
  } else {
    return undefined
  }
}

function toAttrs(
  attrs: (Attribute | Directive)[],
  scope: Record<string, DefaultValue>
): Record<string, DefaultValue> {
  const res: Record<string, DefaultValue> = {}

  attrs.forEach(attr => {
    if (!attr.directive) {
      res[attr.name] = attr.value
    } else if (inScope(attr.expression, scope)) {
      if (attr.name === 'bind' && attr.argument) {
        res[attr.argument] = scope[attr.expression]
      } else if (attr.name === 'model') {
        res.value = scope[attr.expression]
      }
    }
  })

  return res
}

function toDomProps(
  attrs: (Attribute | Directive)[],
  scope: Record<string, DefaultValue>
): Record<string, any> {
  const res: Record<string, any> = {}

  attrs.forEach(attr => {
    if (attr.directive) {
      if (attr.name === 'text') {
        res.textContent = directiveValue(attr, scope)
      } else if (attr.name === 'html') {
        res.innerHTML = directiveValue(attr, scope)
      }
    }
  })

  return res
}

function getVShowDirective(
  attrs: (Attribute | Directive)[],
  scope: Record<string, DefaultValue>
): VNodeDirective | undefined {
  const vShow = findDirective(attrs, a => a.name === 'show')
  if (!vShow) return

  const modifierMap: Record<string, boolean> = {}
  vShow.modifiers.forEach(modifier => {
    modifierMap[modifier] = true
  })

  return {
    name: 'show',
    expression: vShow.expression,
    oldValue: undefined,
    arg: vShow.argument || '',
    modifiers: modifierMap,
    value: directiveValue(vShow, scope)
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
      last.attributes,
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

function resolveVIf(
  acc: ElementChild[],
  child: ElementChild,
  scope: Record<string, DefaultValue>
): ElementChild[] {
  if (child.type === 'Element') {
    const vIf = findDirective(child.attributes, d => d.name === 'if')
    if (vIf) {
      return directiveValue(vIf, scope) ? acc.concat(child) : acc
    }

    const vElse = findDirective(child.attributes, d => {
      return d.name === 'else' || d.name === 'else-if'
    })
    if (vElse) {
      const isElement = (node: ElementChild): node is Element => {
        return node.type === 'Element'
      }
      const elements = acc.filter(isElement)

      if (!shouldAppearVElse(scope, elements)) {
        return acc
      }

      if (vElse.name === 'else') {
        return acc.concat(child)
      }

      return directiveValue(vElse, scope) ? acc.concat(child) : acc
    }
  }

  return acc.concat(child)
}

function createVNodeData(
  node: Element,
  scope: Record<string, DefaultValue>
): VNodeData {
  const vShow = getVShowDirective(node.attributes, scope)

  return {
    attrs: toAttrs(node.attributes, scope),
    domProps: toDomProps(node.attributes, scope),
    directives: vShow ? [vShow] : []
  }
}

export default Vue.extend({
  name: 'Node',
  functional: true,

  props: {
    data: {
      type: Object as { (): Element },
      required: true
    },
    scope: {
      type: Object as { (): Record<string, string> },
      required: true
    }
  },

  render(h, { props }): VNode {
    const { data, scope } = props

    const filteredChildren = data.children.reduce<ElementChild[]>(
      (acc, child) => resolveVIf(acc, child, scope),
      []
    )

    return h(
      data.name,
      createVNodeData(data, scope),
      filteredChildren.map(c => {
        return h(Child, {
          props: {
            data: c,
            scope
          }
        })
      })
    )
  }
})
</script>
