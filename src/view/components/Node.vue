<script lang="ts">
import Vue, { VNode, VNodeDirective } from 'vue'
import Child from './Child.vue'
import { Element, Attribute, Directive } from '../../parser/template'
import { DefaultValue } from '../../parser/script'

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

    return h(
      data.name,
      {
        attrs: toAttrs(data.attributes, scope),
        directives: vShow ? [vShow] : []
      },
      data.children.map(c =>
        h(Child, {
          props: {
            data: c,
            scope
          }
        })
      )
    )
  }
})
</script>
