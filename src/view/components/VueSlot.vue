<script lang="ts">
import { defineComponent, h, VNode } from 'vue'
import VueChild from './VueChild.vue'
import { TEElement } from '../../parser/template/types'
import { DefaultValue, ChildComponent } from '../../parser/script/types'
import { convertToSlotScope } from '../ui-logic/rendering'

export default defineComponent({
  name: 'VueSlot',

  props: {
    uri: {
      type: String,
      required: true,
    },
    data: {
      type: Object as { (): TEElement },
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

  render(): VNode[] {
    const { data, scope, slots } = this

    const slotScope = convertToSlotScope(data.startTag, scope)

    const slotName = String(slotScope.name || 'default')
    delete slotScope.name

    const slot = slots[slotName]
    if (slot) {
      return slot(slotScope)
    }

    // placeholder content
    return this.data.children.map((child) => {
      return h(VueChild, {
        uri: this.uri,
        data: child,
        scope: this.scope,
        childComponents: this.childComponents,
        slots,
      })
    })
  },
})
</script>
