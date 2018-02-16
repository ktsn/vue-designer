<script lang="ts">
import Vue, { VNode } from 'vue'
import ContainerVueComponent from './ContainerVueComponent.vue'

export default Vue.extend({
  name: 'Renderer',
  functional: true,

  render(h, { data }): VNode {
    return h('div', { class: 'renderer' }, [h(ContainerVueComponent, data)])
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
