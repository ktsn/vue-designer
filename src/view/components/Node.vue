<script lang="ts">
import Vue, { VNode, VNodeData } from 'vue'
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

function convertToVNodeData(
  attrs: (Attribute | Directive)[],
  scope: Record<string, DefaultValue>
): VNodeData {
  const initial: VNodeData = {
    attrs: {},
    domProps: {},
    directives: []
  }

  return attrs.reduce((acc, attr) => {
    // Normal attribute
    if (!attr.directive) {
      acc.attrs![attr.name] = attr.value
      return acc
    }

    // Directive
    if (attr.name === 'bind' && attr.argument) {
      acc.attrs![attr.argument] = directiveValue(attr, scope)
    } else if (attr.name === 'model') {
      acc.attrs!.value = directiveValue(attr, scope)
    } else if (attr.name === 'text') {
      acc.domProps!.textContent = directiveValue(attr, scope)
    } else if (attr.name === 'html') {
      acc.domProps!.innerHTML = directiveValue(attr, scope)
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
        value: directiveValue(attr, scope)
      })
    }
    return acc
  }, initial)
}

function createVNodeData(
  node: Element,
  scope: Record<string, DefaultValue>,
  selected: boolean,
  listeners: Record<string, Function>
): VNodeData {
  const data = convertToVNodeData(node.attributes, scope)

  data.class = { selected }
  data.on = {
    click: (event: Event) => {
      event.stopPropagation()
      listeners.select(node)
    }
  }

  return data
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
      type: Object as { (): Record<string, DefaultValue> },
      required: true
    },
    selected: Boolean
  },

  // @ts-ignore
  render(h, { props, listeners }): VNode {
    const { data, scope, selected } = props

    const filteredChildren = data.children.reduce<ElementChild[]>(
      (acc, child) => resolveVIf(acc, child, scope),
      []
    )

    return h(
      data.name,
      createVNodeData(data, scope, selected, listeners),
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
