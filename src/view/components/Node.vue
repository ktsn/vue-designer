<script lang="ts">
import Vue, { VNode, VNodeData } from 'vue'
import ContainerVueComponent from './ContainerVueComponent.vue'
import Child from './Child.vue'
import { Element } from '@/parser/template'
import { DefaultValue, ChildComponent } from '@/parser/script'
import {
  convertToVNodeData,
  resolveControlDirectives,
  ResolvedChild
} from '../rendering'

function createVNodeData(
  node: Element,
  scope: Record<string, DefaultValue>,
  selectable: boolean,
  selected: boolean,
  listeners: Record<string, Function>
): VNodeData {
  const data = convertToVNodeData(node.attributes, scope)

  if (selectable) {
    if (selected) {
      data.class.push('selected')
    }

    data.attrs!.tabindex = '0'

    // The vnode may be a native element or ContainerVueComponent,
    // so we should set both `on` and `nativeOn` here.
    data.on = data.nativeOn = {
      click: (event: Event) => {
        event.stopPropagation()
        if (typeof listeners.select === 'function') {
          listeners.select(node)
        }
      }
    }
  }

  return data
}

function findChildComponentUri(
  node: Element,
  childComponents: ChildComponent[]
): string | undefined {
  const comp = childComponents.find(child => {
    // Convert to lower case since vue-eslint-parser ignores tag name case.
    return child.name.toLowerCase() === node.name.toLowerCase()
  })
  return comp && comp.uri
}

export default Vue.extend({
  name: 'Node',
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
    selectable: Boolean,
    selected: Boolean
  },

  // @ts-ignore
  render(h, { props, listeners }): VNode {
    const { uri, data, scope, childComponents, selectable, selected } = props

    const resolvedChildren = data.children.reduce<ResolvedChild[]>(
      (acc, child) => {
        return resolveControlDirectives(acc, {
          el: child,
          scope
        })
      },
      []
    )

    const componentUri = findChildComponentUri(data, childComponents)
    const vnodeData = createVNodeData(
      data,
      scope,
      selectable,
      selected,
      listeners
    )
    if (componentUri) {
      vnodeData.props = { uri: componentUri }
    }

    return h(
      componentUri ? ContainerVueComponent : data.name,
      vnodeData,
      resolvedChildren.map(c => {
        return h(Child, {
          props: {
            uri,
            data: c.el,
            scope: c.scope,
            childComponents
          },
          on: listeners
        })
      })
    )
  }
})
</script>
