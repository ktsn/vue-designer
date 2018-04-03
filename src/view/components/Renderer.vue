<script lang="ts">
import Vue, { VNode } from 'vue'
import Viewport from './Viewport.vue'
import VueComponent from './VueComponent.vue'
import { ScopedDocument } from '../store/modules/project'

export default Vue.extend({
  name: 'Renderer',
  functional: true,

  props: {
    document: {
      type: Object as () => ScopedDocument,
      required: true
    },
    width: {
      type: Number,
      required: true
    },
    height: {
      type: Number,
      required: true
    }
  },

  // @ts-ignore
  render(h, { props, listeners }): VNode {
    const { document: d, width, height } = props
    return h(
      'div',
      {
        class: 'renderer',
        on: {
          click: () => {
            if (listeners.select) {
              listeners.select()
            }
          }
        }
      },
      [
        h(
          Viewport,
          {
            props: {
              width,
              height
            },
            on: listeners
          },
          [
            h(VueComponent, {
              props: {
                uri: d.uri,
                template: d.template,
                props: d.props,
                data: d.data,
                childComponents: d.childComponents,
                styles: d.styleCode
              },
              on: listeners
            })
          ]
        )
      ]
    )
  }
})
</script>

<style lang="scss" scoped>
.renderer {
  all: initial;
  display: block;
  position: relative;
  height: 100%;
  width: 100%;
}
</style>
