<script lang="ts">
import Vue, { VNode } from 'vue'
import Child from './Child.vue'
import { Element } from '@/parser/template/types'
import { DefaultValue, ChildComponent } from '@/parser/script/types'

export default Vue.extend({
  name: 'NodeSlot',
  functional: true,

  props: {
    uri: {
      type: String,
      required: true
    },
    data: {
      type: Object as { (): Element },
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
    }
  },

  render(h, { props }): any /* VNode[] */ {
    const { data, slots } = props
    const slotAttr = data.startTag.attributes.find(attr => attr.name === 'name')
    const slot = slots[slotAttr ? slotAttr.value : 'default']

    if (!slot) {
      // placeholder content
      return props.data.children.map(child => {
        return h(Child, {
          props: {
            uri: props.uri,
            data: child,
            scope: props.scope,
            childComponents: props.childComponents,
            slots
          }
        })
      })
    }

    return slot
  }
})
</script>
