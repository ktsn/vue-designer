<script lang="ts">
import { defineComponent, h, VNode, Component } from 'vue'
import ContainerVueComponent from './ContainerVueComponent.vue'
import VueChild from './VueChild.vue'
import { TEElement } from '../../parser/template/types'
import { DefaultValue, ChildComponent } from '../../parser/script/types'
import {
  convertToVNodeProps,
  resolveControlDirectives,
  ResolvedChild,
  resolveSlots,
  resolveDirectives,
} from '../ui-logic/rendering'
import { DraggingPlace } from '../store/modules/project/types'
import { mapValues } from '../../utils'

export default defineComponent({
  name: 'VueNode',

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
    selectable: {
      type: Boolean,
      default: false,
    },
    selected: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    vnodeTag(): string | Component {
      if (this.nodeUri) {
        return ContainerVueComponent
      }

      return this.data.name
    },

    vnodeProps(): Record<string, any> {
      const { data: node, scope, selectable } = this
      const vnodeProps = convertToVNodeProps(node.startTag, scope)
      const tag = this.vnodeTag

      if (selectable) {
        // The vnode may be a native element or ContainerVueComponent
        vnodeProps.onClick = this.onClick
        vnodeProps.onDragover = this.onDragOver
        vnodeProps.onDrop = this.onDrop
      }

      if (tag === ContainerVueComponent) {
        vnodeProps.uri = this.nodeUri
        vnodeProps.propsData = { ...vnodeProps }
      }

      return vnodeProps
    },

    /**
     * Get corresponding component URI of this node.
     * If it has a URI, is treated as a component rather than native element.
     */
    nodeUri(): string | undefined {
      const comp = this.childComponents.find((child) => {
        // Convert to lower case since vue-eslint-parser ignores tag name case.
        return child.name.toLowerCase() === this.data.name.toLowerCase()
      })
      return comp && comp.uri
    },

    /**
     * Returns children which is resolved v-for, v-if and its family.
     */
    resolvedChildren(): Record<string, (props: any) => VNode[]> {
      return mapValues(resolveSlots(this.data), ({ scopeName, contents }) => {
        return (props: any) => {
          const newScope = scopeName
            ? {
                ...this.scope,
                [scopeName]: props,
              }
            : this.scope

          const resolved = contents.reduce<ResolvedChild[]>((acc, child) => {
            return resolveControlDirectives(acc, {
              el: child,
              scope: newScope,
            })
          }, [])

          return resolved.map((c) => {
            return h(VueChild, {
              ...this.$attrs,
              uri: this.uri,
              data: c.el,
              scope: c.scope,
              childComponents: this.childComponents,
              slots: this.slots,
            })
          })
        }
      })
    },
  },

  methods: {
    onClick(event: Event): void {
      event.stopPropagation()

      this.$emit('select', {
        ast: this.data,
        element: event.currentTarget,
      })
    },

    onDragOver(event: DragEvent): void {
      if (this.data.path.length === 0) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy'
      }

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
        place,
      })
    },

    onDrop(event: DragEvent): void {
      if (this.data.path.length === 0) {
        return
      }

      event.stopPropagation()
      this.$emit('add')
    },
  },

  render(): VNode {
    const vnode = h(this.vnodeTag, this.vnodeProps, this.resolvedChildren)

    return resolveDirectives(vnode, this.data.startTag, this.scope)
  },
})
</script>
