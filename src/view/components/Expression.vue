<script lang="ts">
import Vue, { VNode } from 'vue'
import { DefaultValue } from '@/parser/script/types'
import { evalWithScope, EvalSuccess } from '../eval'

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
    const resolved = result.isSuccess && result.value != null
    const str = resolved
      ? String((result as EvalSuccess).value)
      : '{{ ' + exp + ' }}'

    return h(
      'span',
      {
        class: {
          unresolved: !resolved
        }
      },
      [str]
    )
  }
})
</script>

<style lang="scss" scoped>
.unresolved {
  padding: 2px;
  margin: -2px;
  background-color: rgba(119, 166, 255, 0.3);
  border-radius: 3px;
}
</style>
