<script lang="ts">
import Vue, { VNode } from 'vue'
import Child from './Child.vue'
import { Element, Attribute, Directive } from '../../parser/template'
import { DefaultValue } from '../../parser/script'

function toAttrs(
  attrs: (Attribute | Directive)[],
  scope: Record<string, DefaultValue>
): Record<string, DefaultValue> {
  const res: Record<string, DefaultValue> = {}

  attrs.forEach(attr => {
    if (!attr.directive) {
      res[attr.name] = attr.value
    } else {
      if (
        attr.name === 'bind' &&
        attr.argument &&
        attr.expression &&
        attr.expression in scope
      ) {
        res[attr.argument] = scope[attr.expression]
      }
    }
  })

  return res
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
    return h(
      data.name,
      {
        attrs: toAttrs(data.attributes, scope)
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
