<script lang="ts">
import Vue, { VNode, VNodeData } from 'vue'
import ContainerVueComponent from './ContainerVueComponent.vue'
import Child from './Child.vue'
import { Element } from '@/parser/template/types'
import { DefaultValue, ChildComponent } from '@/parser/script/types'
import {
  convertToVNodeData,
  resolveControlDirectives,
  ResolvedChild
} from '../rendering'
import { DraggingPlace } from '../store/modules/project/types'

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
      const { data: node, scope, selectable } = this
      const data = convertToVNodeData(
        node.name,
        node.startTag.attributes,
        scope
      )

      if (selectable) {
        // The vnode may be a native element or ContainerVueComponent,
        // so we should set both `on` and `nativeOn` here.
        data.on = data.nativeOn = {
          click: this.onClick,
          dragover: this.onDragOver,
          drop: this.onDrop
        }
      }

      // If there is matched nodeUri, the vnode will be ContainerVueComponent
      if (this.nodeUri) {
        data.props = {
          uri: this.nodeUri,
          propsData: data.attrs
        }
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

      this.$emit('select', {
        ast: this.data,
        element: event.currentTarget
      })
    },

    onDragOver(event: DragEvent): void {
      if (this.data.path.length === 0) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      event.dataTransfer.dropEffect = 'copy'

      // Detect where the dragging node will be put
      const outRatio = 0.2
      const bounds = (event.target as HTMLElement).getBoundingClientRect()
      const h = bounds.height
      const posY = event.pageY - bounds.top
      const ratioY = posY / h

      let place: DraggingPlace
      if (ratioY <= outRatio) {
        place = 'before'
      } else if (ratioY < 0.5) {
        place = 'first'
      } else if (ratioY < 1 - outRatio) {
        place = 'last'
      } else {
        place = 'after'
      }

      this.$emit('dragover', {
        path: this.data.path,
        place
      })
    },

    onDrop(event: DragEvent): void {
      if (this.data.path.length === 0) {
        return
      }

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
