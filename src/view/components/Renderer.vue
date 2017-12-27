<script lang="ts">
import Vue, { VNode } from 'vue'
import Component from './Component.vue'

export default Vue.extend({
  name: 'Renderer',
  functional: true,

  render(h, { data }): VNode {
    return h('div', { class: 'renderer' }, [h(Component, data)])
  }
})
</script>

<style lang="scss" scoped>
.renderer {
  position: relative;
  font-size: initial;
  font-family: initial;
}
</style>

