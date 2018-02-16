<script lang="ts">
import Vue, { VNode, VNodeData } from 'vue'
import Child from './Child.vue'
import { Element } from '@/parser/template'
import { DefaultValue } from '@/parser/script'
import {
  convertToVNodeData,
  resolveControlDirectives,
  ResolvedChild
} from '../rendering'

function createVNodeData(
  node: Element,
  scope: Record<string, DefaultValue>,
  selected: boolean,
  listeners: Record<string, Function>
): VNodeData {
  const data = convertToVNodeData(node.attributes, scope)

  if (selected) {
    data.class.push('selected')
  }

  data.attrs!.tabindex = '0'

  data.on = {
    click: (event: Event) => {
      event.stopPropagation()
      listeners.select(node)
    }
  }

  return data
}

export default Vue.extend({
  name: 'Node',
  functional: true,

  props: {
    data: {
      type: Object as { (): Element },
      required: true
    },
    scope: {
      type: Object as { (): Record<string, DefaultValue> },
      required: true
    },
    selected: Boolean
  },

  // @ts-ignore
  render(h, { props, listeners }): VNode {
    const { data, scope, selected } = props

    const resolvedChildren = data.children.reduce<ResolvedChild[]>(
      (acc, child) => {
        return resolveControlDirectives(acc, {
          el: child,
          scope
        })
      },
      []
    )

    return h(
      data.name,
      createVNodeData(data, scope, selected, listeners),
      resolvedChildren.map(c => {
        return h(Child, {
          props: {
            data: c.el,
            scope: c.scope
          }
        })
      })
    )
  }
})
</script>
