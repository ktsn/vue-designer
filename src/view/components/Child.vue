<script lang="ts">
import Vue, { VNode } from 'vue'
import Node from './Node.vue'
import Expression from './Expression.vue'
import { ElementChild } from '../../parser/template'
import { DefaultValue } from '../../parser/script'

export default Vue.extend({
  name: 'Child',
  functional: true,

  props: {
    data: {
      type: Object as { (): ElementChild },
      required: true
    },

    scope: {
      type: Object as { (): Record<string, DefaultValue> },
      required: true
    }
  },

  render(h, { props }): VNode {
    const { data, scope } = props
    switch (data.type) {
      case 'Element':
        return h(Node, { props: { data, scope } })
      case 'TextNode':
        return h('span', [data.text])
      case 'ExpressionNode':
        return h(Expression, {
          props: {
            expression: data.expression,
            scope
          }
        })
      default:
        return h()
    }
  }
})
</script>
