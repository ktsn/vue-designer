<template>
  <div class="toolbar">
    <div class="toolbar-item">
      <input
        v-model="dirtyWidth"
        type="text"
        class="toolbar-input viewport-size-input"
        @focus="selectAll($event.target)"
        @keydown.enter="applySize"
      >
      <span class="toolbar-input-char">x</span>
      <input
        v-model="dirtyHeight"
        type="text"
        class="toolbar-input viewport-size-input"
        @focus="selectAll($event.target)"
        @keydown.enter="applySize"
      >
    </div>

    <div class="toolbar-item">
      <input
        v-model="dirtyScale"
        type="text"
        class="toolbar-input viewport-scale-input"
        @focus="selectAll($event.target)"
        @keydown.enter="applyScale"
      >
      <span class="toolbar-input-char">%</span>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Toolbar',

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

  data() {
    return {
      dirtyWidth: this.width,
      dirtyHeight: this.height,
      dirtyScale: this.scale * 100
    }
  },

  methods: {
    resetSize(): void {
      this.dirtyWidth = this.width
      this.dirtyHeight = this.height
    },

    resetScale(): void {
      this.dirtyScale = this.scale * 100
    },

    selectAll(target: HTMLInputElement): void {
      target.select()
    },

    applySize(): void {
      const width = Number(this.dirtyWidth)
      const height = Number(this.dirtyHeight)

      if (Number.isNaN(width) || Number.isNaN(height)) {
        this.resetSize()
      } else {
        this.$emit('resize', {
          width,
          height
        })
      }
    },

    applyScale(): void {
      const scale = Number(this.dirtyScale)

      if (Number.isNaN(scale)) {
        this.resetScale()
      } else {
        this.$emit('zoom', scale / 100)
      }
    }
  },

  watch: {
    width: 'resetSize',
    height: 'resetSize',
    scale: 'resetScale'
  }
})
</script>


<style lang="scss" scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 12px;
  height: 100%;
  background-color: #333;
  color: #fff;
}

.toolbar-item {
  margin-left: 30px;
  font-size: rem(14);
}

.toolbar-item:first-child {
  margin-left: 0;
}

.toolbar-input {
  padding: 2px 4px;
  border-width: 0;
  font-size: inherit;
  font-family: inherit;
}

.toolbar-input,
.toolbar-input-char {
  vertical-align: middle;
}

.viewport-size-input {
  width: 3.2em;
  text-align: center;
}

.viewport-scale-input {
  width: 3.2em;
  text-align: center;
}
</style>
