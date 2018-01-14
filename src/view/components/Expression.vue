<script lang="ts">
import Vue, { VNode } from 'vue'
import { DefaultValue } from '../../parser/script'

export default Vue.extend({
  name: 'Expression',
  functional: true,

  props: {
    expression: {
      type: String,
      required: true
    },

    scope: {
      type: Object as { (): Record<string, DefaultValue> },
      required: true
    }
  },

  render(h, { props }): VNode {
    const { expression: exp, scope } = props
    const inScope = exp in scope
    const str = inScope ? toStringForPrint(scope[exp]) : '{{ ' + exp + ' }}'

    // Using inline styles for now since we cannot use <style> block.
    // Because the <Render> component is in Shadow DOM.
    const style = !inScope
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

function toStringForPrint(value: DefaultValue): string {
  if (value == null) {
    return ''
  } else {
    return String(value)
  }
}
</script>
