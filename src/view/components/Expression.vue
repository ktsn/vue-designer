<script lang="ts">
import Vue, { VNode } from 'vue'

export default Vue.extend({
  name: 'Expression',
  functional: true,

  props: {
    expression: {
      type: String,
      required: true
    },

    scope: {
      type: Object as { (): Record<string, string> },
      required: true
    }
  },

  render(h, { props }): VNode {
    const { expression: exp, scope } = props
    const ref = scope[exp]

    const str = ref == null ? '{{ ' + exp + ' }}' : ref

    // Using inline styles for now since we cannot use <style> block.
    // Because the <Render> component is in Shadow DOM.
    const style =
      ref != null
        ? {}
        : {
            padding: '2px',
            margin: '-2px',
            'background-color': 'rgba(119, 166, 255, 0.3)',
            'border-radius': '3px'
          }

    return h('span', { style }, [str])
  }
})
</script>
