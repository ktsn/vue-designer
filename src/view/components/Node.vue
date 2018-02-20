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

export default Vue.extend({
  name: 'Node',

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

  computed: {
    vnodeData(): VNodeData {
      const { data: node, scope, selectable, selected } = this
      const data = convertToVNodeData(node.attributes, scope)

      if (selectable) {
        if (selected) {
          data.class.push('selected')
        }

        data.attrs!.tabindex = '0'

        // The vnode may be a native element or ContainerVueComponent,
        // so we should set both `on` and `nativeOn` here.
        data.on = data.nativeOn = {
          click: this.onClick,
          dragover: this.onDragOver,
          drop: this.onDrop
        }
      }

      if (this.nodeUri) {
        data.props = { uri: this.nodeUri }
      }

      return data
    },

    /**
     * Get corresponding component URI of this node.
     * If it has a URI, is treated as a component rather than native element.
     */
    nodeUri(): string | undefined {
      const comp = this.childComponents.find(child => {
        // Convert to lower case since vue-eslint-parser ignores tag name case.
        return child.name.toLowerCase() === this.data.name.toLowerCase()
      })
      return comp && comp.uri
    },

    /**
     * Returns children which is resolved v-for, v-if and its family.
     */
    resolvedChildren(): ResolvedChild[] {
      return this.data.children.reduce<ResolvedChild[]>((acc, child) => {
        return resolveControlDirectives(acc, {
          el: child,
          scope: this.scope
        })
      }, [])
    }
  },

  methods: {
    onClick(event: Event): void {
      event.stopPropagation()
      this.$emit('select', this.data)
    },

    onDragOver(event: DragEvent): void {
      event.preventDefault()
      event.stopPropagation()
      event.dataTransfer.dropEffect = 'copy'

      // Detect where the dragging node will be put
      const outRatio = 0.15
      const bounds = (event.target as HTMLElement).getBoundingClientRect()
      const h = bounds.height
      const posY = event.pageY - bounds.top
      const ratioY = posY / h

      let path: number[]
      if (ratioY <= outRatio) {
        path = this.data.path
      } else if (ratioY < 0.5) {
        path = this.data.path.concat(0)
      } else if (ratioY < 1 - outRatio) {
        const last = this.data.children.length
        path = this.data.path.concat(last)
      } else {
        const parentPath = this.data.path.slice(0, -1)
        const last = this.data.path[parentPath.length]
        path = parentPath.concat(last + 1)
      }

      this.$emit('dragenter', path)
    },

    onDrop(event: DragEvent): void {
      event.stopPropagation()
      this.$emit('add')
    }
  },

  render(h): VNode {
    const { uri, data, childComponents } = this

    return h(
      this.nodeUri ? ContainerVueComponent : data.name,
      this.vnodeData,
      this.resolvedChildren.map(c => {
        return h(Child, {
          props: {
            uri,
            data: c.el,
            scope: c.scope,
            childComponents
          },
          on: this.$listeners
        })
      })
    )
  }
})
</script>
