<script lang="ts">
import Vue, { CreateElement, VNode, VNodeDirective } from 'vue'
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
  return attrs.find(attr => {
    return attr.directive && fn(attr)
  }) as Directive | undefined
}

function inScope(
  exp: string | null,
  scope: Record<string, DefaultValue>
): exp is string {
  return Boolean(exp && exp in scope)
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

function getVShowDirective(
  attrs: (Attribute | Directive)[],
  scope: Record<string, DefaultValue>
): VNodeDirective | undefined {
  const vShow = attrs.find(a => a.directive && a.name === 'show') as
    | Directive
    | undefined
  if (!vShow) return

  const modifierMap: Record<string, boolean> = {}
  vShow.modifiers.forEach(modifier => {
    modifierMap[modifier] = true
  })

  const exp = vShow.expression
  const value = vShow.value || (inScope(exp, scope) && scope[exp])

  return {
    name: 'show',
    expression: vShow.expression,
    oldValue: undefined,
    arg: vShow.argument || '',
    modifiers: modifierMap,
    value
  }
}

function shouldAppearChild(
  prevChild: ElementChild | undefined,
  child: ElementChild,
  scope: Record<string, DefaultValue>
): boolean {
  if (child.type === 'TextNode' || child.type === 'ExpressionNode') {
    return true
  }

  const vIf = findDirective(child.attributes, d => d.name === 'if')
  if (!vIf) {
    return true
  }

  const exp = vIf.expression
  return vIf.value || (inScope(exp, scope) && scope[exp])
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
    const vShow = getVShowDirective(data.attributes, scope)

    const filteredChildren = data.children.filter((child, i) =>
      shouldAppearChild(data.children[i - 1], child, scope)
    )

    return h(
      data.name,
      {
        attrs: toAttrs(data.attributes, scope),
        directives: vShow ? [vShow] : []
      },
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
