<script lang="ts">
import Vue, { VNode } from 'vue'
import Child from './Child.vue'
import { Template } from '@/parser/template'
import { DefaultValue, Prop, Data, ChildComponent } from '@/parser/script'
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
    props: {
      type: Array as { (): Prop[] },
      required: true
    },
    data: {
      type: Array as { (): Data[] },
      required: true
    },
    childComponents: {
      type: Array as { (): ChildComponent[] },
      required: true
    }
  },

  computed: {
    scope(): Record<string, DefaultValue> {
      const scope: Record<string, DefaultValue> = {}
      const data: { name: string; default?: DefaultValue }[] = [
        ...this.props,
        ...this.data
      ]

      data.forEach(({ name, default: value }) => {
        scope[name] = value
      })

      return scope
    }
  },

  render(h): VNode {
    const children = [h('style', { domProps: { textContent: this.styles } })]

    if (this.template) {
      this.template.children
        .reduce<ResolvedChild[]>((acc, child) => {
          return resolveControlDirectives(acc, { el: child, scope: this.scope })
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

                dragenter: (path: number[]) => {
                  this.$emit('dragenter', path)
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
