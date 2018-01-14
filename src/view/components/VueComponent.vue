<script lang="ts">
import Vue, { VNode } from 'vue'
import ShadowDom from '../mixins/shadow-dom'
import Child from './Child.vue'
import { Template } from '../../parser/template'
import { DefaultValue, Prop, Data } from '../../parser/script'

export default Vue.extend({
  name: 'VueComponent',

  mixins: [ShadowDom],

  props: {
    template: Object as { (): Template | undefined },
    styles: {
      type: Array as { (): string[] },
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
    // TODO: use parsed styles
    const children = this.styles.map((style: string) => {
      return h('style', { domProps: { textContent: style } })
    })

    if (this.template) {
      children.push(
        ...this.template.children.map(c => {
          return h(Child, {
            props: {
              data: c,
              scope: this.scope
            }
          })
        })
      )
    }

    return h('div', children)
  }
})
</script>
