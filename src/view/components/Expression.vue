<script lang="ts">
import Vue, { VNode } from 'vue'
import { DefaultValue } from '../../parser/script'
import { evalWithScope } from '../eval'

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
    const result = evalWithScope(exp, scope)
    const str = result.isSuccess
      ? toStringForPrint(result.value)
      : '{{ ' + exp + ' }}'

    return h(
      'span',
      {
        class: {
          unresolved: !result.isSuccess
        }
      },
      [str]
    )
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

<style lang="scss" scoped>
.unresolved {
  padding: 2px;
  margin: -2px;
  background-color: rgba(119, 166, 255, 0.3);
  border-radius: 3px;
}
</style>
