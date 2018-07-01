<script lang="ts">
import Vue, { VNode } from 'vue'
import Node from './Node.vue'
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
    }
  },

  render(h, { props }): VNode {
    // @ts-ignore
    return props.data.children.map(child => {
      return h(Node, {
        props: {
          uri: props.uri,
          data: child,
          scope: props.scope,
          childComponents: props.childComponents
        }
      })
    })
  }
})
</script>
