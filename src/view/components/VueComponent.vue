<script lang="ts">
import Vue, { VNode } from 'vue'
import VueChild from './VueChild.vue'
import { TETemplate } from '@/parser/template/types'
import { ChildComponent } from '@/parser/script/types'
import { DocumentScope } from '@/view/store/modules/project/types'
import { resolveControlDirectives, ResolvedChild } from '../rendering'

export default Vue.extend({
  name: 'VueComponent',

  props: {
    uri: {
      type: String,
      required: true
    },
    template: Object as { (): TETemplate | undefined },
    styles: {
      type: String,
      required: true
    },
    scope: {
      type: Object as { (): DocumentScope },
      required: true
    },
    childComponents: {
      type: Array as { (): ChildComponent[] },
      required: true
    },
    propsData: {
      type: Object as { (): Record<string, any> },
      default: () => ({})
    }
  },

  computed: {
    scopeValues(): Record<string, any> {
      const values: Record<string, any> = {}

      Object.keys(this.scope.props).forEach(name => {
        const prop = this.scope.props[name]

        if (name in this.propsData) {
          const propValue = this.propsData[name]

          // Coerce empty string to `true` when it is declared as boolean prop
          values[name] =
            prop.type === 'Boolean' && propValue === '' ? true : propValue
        } else {
          values[name] = prop.value
        }
      })

      Object.keys(this.scope.data).forEach(name => {
        values[name] = this.scope.data[name].value
      })

      return values
    }
  },

  render(h): VNode {
    const children = [h('style', { domProps: { textContent: this.styles } })]

    if (this.template) {
      this.template.children
        .reduce<ResolvedChild[]>((acc, child) => {
          return resolveControlDirectives(acc, {
            el: child,
            scope: this.scopeValues
          })
        }, [])
        .forEach(child => {
          return children.push(
            h(VueChild, {
              props: {
                uri: this.uri,
                data: child.el,
                scope: child.scope,
                childComponents: this.childComponents,
                slots: this.$slots,
                scopedSlots: this.$scopedSlots
              },
              on: {
                select: (path: number[]) => {
                  this.$emit('select', path)
                },

                dragover: (path: number[]) => {
                  this.$emit('dragover', path)
                },

                add: () => {
                  this.$emit('add')
                }
              }
            })
          )
        })
    }

    return h('div', children)
  }
})
</script>
