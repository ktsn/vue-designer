<template>
  <div class="viewport">
    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Viewport'
})
</script>

<style lang="scss" scoped>
.viewport {
  overflow: auto;
  position: absolute;
  top: 40px;
  bottom: 40px;
  left: 40px;
  right: 40px;
  background-color: #fff;
  box-shadow: 5px 5px 30px rgba(0, 0, 0, 0.1);
}
</style>


