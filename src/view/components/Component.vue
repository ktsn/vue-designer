<script lang="ts">
import Vue, { VNode } from 'vue'
import ShadowDom from '../mixins/shadow-dom'
import Child from './Child.vue'
import { Template } from '../../parser/template'

export default Vue.extend({
  name: 'Component',

  mixins: [ShadowDom],

  props: {
    template: Object as { (): Template | undefined },
    styles: {
      type: Array as { (): string[] },
      required: true
    }
  },

  render(h): VNode {
    // TODO: use parsed styles
    const children = this.styles.map((style: string) => {
      return h('style', { domProps: { textContent: style } })
    })

    if (this.template) {
      children.push(
        h(
          'div',
          {
            class: 'renderer'
          },
          this.template.children.map(c => {
            return h(Child, { props: { data: c } })
          })
        )
      )
    }

    return h('div', children)
  }
})
</script>


