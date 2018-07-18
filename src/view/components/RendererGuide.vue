<template>
  <div class="renderer-guide" :style="wrapperStyle" >
    <div class="renderer-guide-margin" :style="marginStyle" />
    <div class="renderer-guide-border" :style="borderStyle" />
    <div class="renderer-guide-padding" :style="paddingStyle" />
    <div class="renderer-guide-select" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

interface GuideBounds {
  left: number
  right: number
  top: number
  bottom: number
}

interface GuideData {
  left: number
  top: number
  width: number
  height: number

  margin: GuideBounds
  border: GuideBounds
  padding: GuideBounds
}

export default Vue.extend({
  name: 'RendererGuide',

  props: {
    guide: {
      type: Object as () => GuideData,
      required: true
    }
  },

  computed: {
    wrapperStyle(): Record<string, string> {
      const { guide } = this
      return {
        left: guide.left + 'px',
        top: guide.top + 'px',
        width: guide.width + 'px',
        height: guide.height + 'px'
      }
    },

    marginStyle(): Record<string, string> {
      const { margin } = this.guide
      return {
        top: -margin.top + 'px',
        bottom: -margin.bottom + 'px',
        left: -margin.left + 'px',
        right: -margin.right + 'px',
        borderTopWidth: margin.top + 'px',
        borderBottomWidth: margin.bottom + 'px',
        borderLeftWidth: margin.left + 'px',
        borderRightWidth: margin.right + 'px'
      }
    },

    borderStyle(): Record<string, string> {
      const { border } = this.guide
      return {
        borderTopWidth: border.top + 'px',
        borderBottomWidth: border.bottom + 'px',
        borderLeftWidth: border.left + 'px',
        borderRightWidth: border.right + 'px'
      }
    },

    paddingStyle(): Record<string, string> {
      const { border, padding } = this.guide
      return {
        top: border.top + 'px',
        bottom: border.bottom + 'px',
        left: border.left + 'px',
        right: border.right + 'px',
        borderTopWidth: padding.top + 'px',
        borderBottomWidth: padding.bottom + 'px',
        borderLeftWidth: padding.left + 'px',
        borderRightWidth: padding.right + 'px'
      }
    }
  }
})
</script>

<style scoped>
.renderer-guide {
  position: absolute;
  pointer-events: none;
}

.renderer-guide-margin,
.renderer-guide-border,
.renderer-guide-padding,
.renderer-guide-select {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  border-style: solid;
}

.renderer-guide-margin {
  border-color: var(--vd-color-guide-margin);
}

.renderer-guide-border {
  border-color: var(--vd-color-guide-border);
}

.renderer-guide-padding {
  border-color: var(--vd-color-guide-padding);
}

.renderer-guide-select {
  border: 1px solid var(--vd-color-selected-border);
}
</style>
