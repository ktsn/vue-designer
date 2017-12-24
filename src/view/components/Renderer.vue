<script lang="ts">
import Vue, { VNode } from 'vue'
import Child from './Child.vue'
import { Template } from '../../parser/template'

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
    const children = props.styles.map((style: string) => {
      return h('style', { domProps: { textContent: style } })
    })

    if (props.template) {
      children.push(
        h('div', props.template.children.map(c => {
          return h(Child, { props: { data: c } })
        }))
      )
    }

    return h('div', children)
  }
})
</script>

