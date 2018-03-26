<template>
  <!-- Since viewport is aligned by center, the offset needs to be multiplied by 2 -->
  <Resizable
    class="viewport-wrapper"
    :width="width"
    :height="height"
    :offset-weight="2"
    @resize="$emit('resize', arguments[0])"
  >
    <div class="viewport">
      <slot />
    </div>
  </Resizable>
</template>

<script lang="ts">
import Vue from 'vue'
import Resizable from './Resizable.vue'

export default Vue.extend({
  name: 'Viewport',

  components: {
    Resizable
  },

  props: {
    width: {
      type: Number,
      required: true
    },
    height: {
      type: Number,
      required: true
    }
  }
})
</script>

<style lang="scss" scoped>
.viewport-wrapper {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
}

.viewport {
  overflow: auto;
  width: 100%;
  height: 100%;
  background-color: #fff;
  box-shadow: 5px 5px 30px rgba(0, 0, 0, 0.1);
}
</style>


