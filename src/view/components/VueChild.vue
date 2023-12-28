<script lang="ts">
import { Comment, defineComponent, h } from 'vue'
import VueSlot from './VueSlot.vue'
import ContainerVueNode from './ContainerVueNode.vue'
import VueExpression from './VueExpression.vue'
import { TEChild } from '../../parser/template/types'
import { DefaultValue, ChildComponent } from '../../parser/script/types'

export default defineComponent({
  name: 'VueChild',

  props: {
    uri: {
      type: String,
      required: true,
    },

    data: {
      type: Object as { (): TEChild },
      required: true,
    },

    scope: {
      type: Object as { (): Record<string, DefaultValue> },
      required: true,
    },

    childComponents: {
      type: Array as { (): ChildComponent[] },
      required: true,
    },

    slots: {
      type: Object as { (): Record<string, any> },
      required: true,
    },
  },

  emits: ['select', 'dragover', 'add'],

  render() {
    const { data, scope } = this
    switch (data.type) {
      case 'Element':
        if (data.name === 'slot') {
          return h(VueSlot, this.$props as any)
        } else {
          return h(ContainerVueNode, {
            ...(this.$props as any),
            onSelect: (...args: any[]) => this.$emit('select', ...args),
            onDragover: (...args: any[]) => this.$emit('dragover', ...args),
            onAdd: (...args: any[]) => this.$emit('add', ...args),
          })
        }
      case 'TextNode':
        return [data.text]
      case 'ExpressionNode':
        return h(VueExpression, {
          expression: data.expression,
          scope,
        })
      default:
        return h(Comment)
    }
  },
})
</script>
