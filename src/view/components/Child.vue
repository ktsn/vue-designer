<script lang="ts">
import Vue, { VNode } from 'vue'
import NodeSlot from './NodeSlot.vue'
import ContainerNode from './ContainerNode.vue'
import Expression from './Expression.vue'
import { ElementChild } from '@/parser/template/types'
import { DefaultValue, ChildComponent } from '@/parser/script/types'

// Assign to a constant to recursively use this component
const Child = Vue.extend({
  name: 'Child',
  functional: true,

  props: {
    uri: {
      type: String,
      required: true
    },

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
    },

    slots: {
      type: Object as { (): Record<string, VNode[]> },
      required: true
    },

    scopedSlots: {
      type: Object,
      required: true
    }
  },

  render(h, { props, listeners }): any /* VNode | VNode[] */ {
    const { data, scope } = props
    switch (data.type) {
      case 'Element':
        const slot = data.startTag.attributes.slot
        const slotName = slot && slot.value

        // Replace AST <template> with actual <template> element
        // to handle named slot in Vue.js correctly.
        if (slotName && data.name === 'template') {
          return h(
            'template',
            { slot: slotName },
            data.children.map(child => {
              return h(Child, {
                props: {
                  ...props,
                  data: child
                },
                on: listeners
              })
            })
          )
        }

        return h(data.name === 'slot' ? NodeSlot : ContainerNode, {
          props,
          on: listeners,
          slot: slotName || 'default'
        })
      case 'TextNode':
        return [data.text]
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
export default Child
</script>
