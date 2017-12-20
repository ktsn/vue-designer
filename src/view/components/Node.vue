<script lang="ts">
import Vue, { VNode } from 'vue'
import { Element } from '../../payload'

export default Vue.extend({
  name: 'Node',
  functional: true,

  props: {
    data: {
      type: Object as { (): Element },
      required: true
    }
  },

  render(h, { props }): VNode {
    const { data } = props
    return h(
      data.name,
      {},
      data.children.map(c => {
        switch (c.type) {
          case 'Element':
            return h('Node', { props: { data: c } })
          case 'TextNode':
            return c.text
          case 'ExpressionNode':
            return c.expression
        }
      })
    )
  }
})
</script>
