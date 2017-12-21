<script lang="ts">
import Vue, { VNode } from 'vue'
import Node from './Node.vue'

export default Vue.extend({
  name: 'Child',
  functional: true,

  props: {
    data: {
      type: Object,
      required: true
    }
  },

  render(h, { props }): VNode {
    const { data } = props
    switch (data.type) {
      case 'Element':
        return h(Node, { props: { data } })
      case 'TextNode':
        return data.text
      case 'ExpressionNode':
        return data.expression
      default:
        return h()
    }
  }
})
</script>
