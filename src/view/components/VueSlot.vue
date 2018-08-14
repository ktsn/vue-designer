<script lang="ts">
import Vue, { VNode, VNodeChildrenArrayContents } from 'vue'
import VueChild from './VueChild.vue'
import { TEElement } from '@/parser/template/types'
import { DefaultValue, ChildComponent } from '@/parser/script/types'
import { convertToSlotScope } from '@/view/rendering'

export default Vue.extend({
  name: 'VueSlot',
  functional: true,

  props: {
    uri: {
      type: String,
      required: true
    },
    data: {
      type: Object as { (): TEElement },
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
      type: Object as {
        (): Record<string, (props: any) => string | VNodeChildrenArrayContents>
      },
      required: true
    }
  },

  render(h, { props }): any /* VNode[] */ {
    const { data, scope, slots, scopedSlots } = props

    const slotScope = convertToSlotScope(data.startTag, scope)

    const slotName = String(slotScope.name || 'default')
    delete slotScope.name

    const slot = slots[slotName]
    const scopedSlot = scopedSlots[slotName]

    if (scopedSlot) {
      return scopedSlot(slotScope)
    }

    if (slot) {
      return slot
    }

    // placeholder content
    return props.data.children.map(child => {
      return h(VueChild, {
        props: {
          uri: props.uri,
          data: child,
          scope: props.scope,
          childComponents: props.childComponents,
          slots,
          scopedSlots
        }
      })
    })
  }
})
</script>
