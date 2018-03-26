<template>
  <div class="resizable" :style="style">
    <slot />
    <div
      class="resizable-handler-se"
      draggable="true"
      @dragstart="onDragStart"
      @drag="onDrag"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Resizable',

  props: {
    width: {
      type: Number,
      required: true
    },
    height: {
      type: Number,
      required: true
    },
    offsetWeight: {
      type: Number,
      default: 1
    }
  },

  data() {
    return {
      base: {
        width: 0,
        height: 0,
        x: 0,
        y: 0
      }
    }
  },

  computed: {
    style(): Record<string, string> {
      return {
        width: this.width + 'px',
        height: this.height + 'px'
      }
    }
  },

  methods: {
    onDragStart(event: DragEvent): void {
      this.base = {
        width: this.width,
        height: this.height,
        x: event.clientX,
        y: event.clientY
      }
    },

    onDrag(event: DragEvent): void {
      const { width, height, x, y } = this.base

      const offsetX = this.offsetWeight * (event.clientX - x)
      const offsetY = this.offsetWeight * (event.clientY - y)

      this.$emit('resize', {
        width: width + offsetX,
        height: height + offsetY
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.resizable {
  position: relative;
}

.resizable-handler-se {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  cursor: nwse-resize;
}
</style>

