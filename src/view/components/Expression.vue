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

    return h('span', { class: 'expression' }, [str])
  }
})
</script>
