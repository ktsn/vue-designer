<script lang="ts">
import Vue, { VNode } from 'vue'

export default Vue.extend({
  name: 'Renderer',
  functional: true,

  props: {
    node: {
      type: Object,
      required: true
    }
  },

  render(h, { props }): VNode {
    // TODO: use parsed template/style
    return h('div', [
      h('style', { domProps: { textContent: props.node.style } }),
      h('div', { domProps: { innerHTML: props.node.template } })
    ])
  }
})
</script>

