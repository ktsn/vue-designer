<script lang="ts">
import Vue, { VNode } from 'vue'
import ContainerNode from './ContainerNode.vue'
import Expression from './Expression.vue'
import { ElementChild } from '../../parser/template'
import { DefaultValue, ChildComponent } from '../../parser/script'

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
    },

    childComponents: {
      type: Array as { (): ChildComponent[] },
      required: true
    }
  },

  render(h, { props }): VNode {
    const { data, scope, childComponents } = props
    switch (data.type) {
      case 'Element':
        return h(ContainerNode, {
          props: {
            data,
            scope,
            childComponents
          }
        })
      case 'TextNode':
        return data.text as any
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
