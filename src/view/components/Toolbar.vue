<template>
  <div class="toolbar">
    <div class="toolbar-item">
      <input
        v-model="dirtyWidth"
        type="text"
        class="toolbar-input viewport-size-input"
        @focus="selectAll($event.currentTarget as HTMLInputElement)"
        @keydown.enter="applySize"
      />
      <span class="toolbar-input-char">x</span>
      <input
        v-model="dirtyHeight"
        type="text"
        class="toolbar-input viewport-size-input"
        @focus="selectAll($event.currentTarget as HTMLInputElement)"
        @keydown.enter="applySize"
      />
    </div>

    <div class="toolbar-item">
      <input
        v-model="dirtyScale"
        type="text"
        class="toolbar-input viewport-scale-input"
        @focus="selectAll($event.currentTarget as HTMLInputElement)"
        @keydown.enter="applyScale"
      />
      <span class="toolbar-input-char">%</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

const scaleFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
  useGrouping: false,
})

export default defineComponent({
  name: 'Toolbar',

  props: {
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    scale: {
      type: Number,
      required: true,
    },
  },

  data() {
    return {
      dirtyWidth: this.width,
      dirtyHeight: this.height,
      dirtyScale: scaleFormatter.format(this.scale * 100),
    }
  },

  watch: {
    width: 'resetSize',
    height: 'resetSize',
    scale: 'resetScale',
  },

  methods: {
    resetSize(): void {
      this.dirtyWidth = this.width
      this.dirtyHeight = this.height
    },

    resetScale(): void {
      this.dirtyScale = scaleFormatter.format(this.scale * 100)
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
          height,
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
    },
  },
})
</script>

<style scoped>
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

.toolbar-input-char {
  margin: 0 5px;
}

.viewport-size-input {
  width: 3.2em;
  text-align: center;
}

.viewport-scale-input {
  width: 4em;
  text-align: center;
}
</style>
