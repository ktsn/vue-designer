<script lang="ts">
import Vue, { VNode } from 'vue'
import VueComponent from './VueComponent.vue'

export default Vue.extend({
  name: 'Renderer',
  functional: true,

  render(h, { data }): VNode {
    return h('div', { class: 'renderer' }, [h(VueComponent, data)])
  }
})
</script>

<style lang="scss" scoped>
.renderer {
  all: initial;
  display: block;
  position: relative;
}
</style>
