<script lang="ts">
import Vue, { VNode } from 'vue'
import Child from './Child.vue'
import { Element, Attribute } from '../../parser/template'

function toAttrs(attrs: Attribute[]): Record<string, string | null> {
  const res: Record<string, string | null> = {}
  attrs.forEach(attr => {
    res[attr.name] = attr.value
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
      { attrs: toAttrs(data.attributes) },
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
