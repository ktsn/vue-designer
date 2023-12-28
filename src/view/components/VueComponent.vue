<script lang="ts">
import { defineComponent, h, VNode, PropType } from 'vue'
import VueChild from './VueChild.vue'
import { TETemplate } from '../../parser/template/types'
import { ChildComponent } from '../../parser/script/types'
import { DocumentScope } from '../store/modules/project/types'
import { resolveControlDirectives, ResolvedChild } from '../ui-logic/rendering'

export default defineComponent({
  name: 'VueComponent',

  props: {
    uri: {
      type: String,
      required: true,
    },
    template: {
      type: Object as { (): TETemplate | undefined },
      default: undefined,
    },
    styles: {
      type: String,
      required: true,
    },
    scope: {
      type: Object as { (): DocumentScope },
    },
    childComponents: {
      type: Array as { (): ChildComponent[] },
      required: true,
    },
    propsData: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({} as Record<string, any>),
    },
  },

  computed: {
    scopeValues(): Record<string, any> {
      const values: Record<string, any> = {}
      const scope = this.scope

      if (scope) {
        Object.keys(scope.props).forEach((name) => {
          const prop = scope.props[name]

          if (name in this.propsData) {
            const propValue = this.propsData[name]

            // Coerce empty string to `true` when it is declared as boolean prop
            values[name] =
              prop.type === 'Boolean' && propValue === '' ? true : propValue
          } else {
            values[name] = prop.value
          }
        })

        Object.keys(scope.data).forEach((name) => {
          values[name] = scope.data[name].value
        })
      }

      return values
    },
  },

  render(): VNode {
    const children = [h('style', { textContent: this.styles })]

    if (this.template) {
      this.template.children
        .reduce<ResolvedChild[]>((acc, child) => {
          return resolveControlDirectives(acc, {
            el: child,
            scope: this.scopeValues,
          })
        }, [])
        .forEach((child) => {
          children.push(
            h(VueChild, {
              uri: this.uri,
              data: child.el,
              scope: child.scope,
              childComponents: this.childComponents,
              slots: this.$slots,

              onSelect: (path: number[]) => {
                this.$emit('select', path)
              },

              onDragover: (path: number[]) => {
                this.$emit('dragover', path)
              },

              onAdd: () => {
                this.$emit('add')
              },
            })
          )
        })
    }

    return h('div', children)
  },
})
</script>
