<script lang="ts">
import Vue, { VNode } from 'vue'
import Node from './Node.vue'
import { Template } from '../../payload'

export default Vue.extend({
  name: 'Renderer',
  functional: true,

  props: {
    template: Object as { (): Template | null },
    styles: {
      type: Array as { (): string[] },
      required: true
    }
  },

  render(h, { props }): VNode {
    // TODO: use parsed styles
    const children = props.styles.map((style: string) => h('style', { domProps: { textContent: style } }))
    if (props.template) {
      children.push(
        h('div', props.template.children.map(c => {
          switch (c.type) {
            case 'Element':
              return h(Node, { props: { data: c } })
            case 'TextNode':
              return c.text
            case 'ExpressionNode':
              return c.expression
          }
        }))
      )
    }
    return h('div', children)
  }
})
</script>

