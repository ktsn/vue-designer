<template>
  <div class="toolbar">
    <div class="toolbar-item">
      <input
        v-model="dirtyWidth"
        type="text"
        class="viewport-size-input"
        @focus="selectAll($event.target)"
        @keydown.enter="apply"
      >
      <span class="viewport-size-char">x</span>
      <input
        v-model="dirtyHeight"
        type="text"
        class="viewport-size-input"
        @focus="selectAll($event.target)"
        @keydown.enter="apply"
      >
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
    }
  },

  data() {
    return {
      dirtyWidth: this.width,
      dirtyHeight: this.height
    }
  },

  methods: {
    resetSize(): void {
      this.dirtyWidth = this.width
      this.dirtyHeight = this.height
    },

    selectAll(target: HTMLInputElement): void {
      target.select()
    },

    apply(): void {
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
    }
  },

  watch: {
    width: 'resetSize',
    height: 'resetSize'
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
  display: inline-block;
  vertical-align: middle;
  font-size: rem(14);
}

.viewport-size-input {
  padding: 2px 4px;
  width: 3.2em;
  border-width: 0;
  font-size: inherit;
  font-family: inherit;
  text-align: center;
}

.viewport-size-input,
.viewport-size-char {
  vertical-align: middle;
}
</style>
