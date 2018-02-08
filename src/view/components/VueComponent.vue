<script lang="ts">
import Vue, { VNode } from 'vue'
import ShadowDom from '../mixins/shadow-dom'
import Node from './Node.vue'
import { Template, Element } from '../../parser/template'
import { DefaultValue, Prop, Data } from '../../parser/script'
import { Style } from '@/parser/style'

export default Vue.extend({
  name: 'VueComponent',

  mixins: [ShadowDom],

  props: {
    template: Object as { (): Template | undefined },
    styles: {
      type: Object as { (): Style },
      required: true
    },
    props: {
      type: Array as { (): Prop[] },
      required: true
    },
    data: {
      type: Array as { (): Data[] },
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
      const rootEl: Element = {
        type: 'Element',
        path: [],
        name: 'div',
        attributes: [],
        children: this.template.children
      }

      children.push(
        h(Node, {
          props: {
            data: rootEl,
            scope: this.scope,
            selected: false
          }
        })
      )
    }

    return h('div', children)
  }
})
</script>
