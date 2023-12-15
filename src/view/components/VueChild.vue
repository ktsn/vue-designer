<script lang="ts">
import Vue, { VNode } from 'vue'
import VueSlot from './VueSlot.vue'
import ContainerVueNode from './ContainerVueNode.vue'
import VueExpression from './VueExpression.vue'
import { TEChild } from '@/parser/template/types'
import { DefaultValue, ChildComponent } from '@/parser/script/types'

// Assign to a constant to recursively use this component
const VueChild = Vue.extend({
  name: 'VueChild',
  functional: true,

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
      type: Object as { (): Record<string, VNode[]> },
      required: true,
    },

    scopedSlots: {
      type: Object,
      required: true,
    },
  },

  render(h, { props, listeners }): any /* VNode | VNode[] */ {
    const { data, scope } = props
    switch (data.type) {
      case 'Element':
        const slot = data.startTag.attrs.slot
        const slotName = slot && slot.value

        // Replace AST <template> with actual <template> element
        // to handle named slot in Vue.js correctly.
        if (slotName && data.name === 'template') {
          return h(
            'template',
            { slot: slotName },
            data.children.map((child) => {
              return h(VueChild, {
                props: {
                  ...props,
                  data: child,
                },
                on: listeners,
              })
            })
          )
        }

        return h(data.name === 'slot' ? VueSlot : ContainerVueNode, {
          props,
          on: listeners,
          slot: slotName || 'default',
        })
      case 'TextNode':
        return [data.text]
      case 'ExpressionNode':
        return h(VueExpression, {
          props: {
            expression: data.expression,
            scope,
          },
        })
      default:
        return h()
    }
  },
})
export default VueChild
</script>
