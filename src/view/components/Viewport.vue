<template>
  <!-- Since viewport is aligned by center, the offset needs to be multiplied by 2 in default scale -->
  <Resizable
    class="viewport-wrapper"
    :width="width"
    :height="height"
    :offset-weight="2 / scale"
    :style="viewportStyle"
    @resize="$emit('resize', arguments[0])"
  >
    <div class="viewport">
      <slot />
    </div>

    <!-- To detect mac trackpad's pinch, we need to listen wheel event with ctrl is pressed -->
    <GlobalEvents @wheel.ctrl="onZoom" />
  </Resizable>
</template>

<script lang="ts">
import Vue from 'vue'
import GlobalEvents from 'vue-global-events'
import Resizable from './Resizable.vue'

export default Vue.extend({
  name: 'Viewport',

  components: {
    GlobalEvents,
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
    },
    scale: {
      type: Number,
      required: true
    }
  },

  computed: {
    viewportStyle(): Record<string, string> {
      return {
        transform: `scale(${this.scale})`
      }
    }
  },

  methods: {
    onZoom(event: WheelEvent): void {
      this.$emit('zoom', this.scale - event.deltaY * 0.01)
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


