<script lang="ts">
import Vue, { VNode } from 'vue'
import Child from './Child.vue'
import { Template } from '@/parser/template/types'
import { ChildComponent } from '@/parser/script/types'
import { DocumentScope } from '@/view/store/modules/project'
import { resolveControlDirectives, ResolvedChild } from '../rendering'

export default Vue.extend({
  name: 'VueComponent',

  props: {
    uri: {
      type: String,
      required: true
    },
    template: Object as { (): Template | undefined },
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
        values[name] =
          name in this.propsData
            ? this.propsData[name]
            : this.scope.props[name].value
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
            h(Child, {
              props: {
                uri: this.uri,
                data: child.el,
                scope: child.scope,
                childComponents: this.childComponents
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
