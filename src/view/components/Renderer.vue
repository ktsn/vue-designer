<template>
  <div class="renderer" @click="$emit('select')">
    <div class="renderer-scroll-content" :style="scrollContentStyle">
      <Viewport
        ref="viewport"
        :width="width"
        :height="height"
        :scale="scale"
        @resize="$emit('resize', arguments[0])"
        @zoom="$emit('zoom', arguments[0])"
      >
        <VueComponent
          :uri="document.uri"
          :template="document.template"
          :props="document.props"
          :data="document.data"
          :child-components="document.childComponents"
          :styles="document.styleCode"
          @select="onSelectNode"
          @dragover="$emit('dragover', arguments[0])"
          @add="$emit('add')"
        />

        <div
          v-if="selectedPath.length > 0"
          :style="selectedStyle"
          class="renderer-selected"
        />
      </Viewport>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Viewport from './Viewport.vue'
import VueComponent from './VueComponent.vue'
import { ScopedDocument } from '../store/modules/project'
import { Element } from '@/parser/template/types'

const scrollContentPadding = 100

export default Vue.extend({
  name: 'Renderer',

  components: {
    Viewport,
    VueComponent
  },

  props: {
    document: {
      type: Object as () => ScopedDocument,
      required: true
    },
    selectedPath: {
      type: Array as () => number[],
      required: true
    },
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
      rendererSize: {
        width: 0,
        height: 0
      },

      selectedBounds: {
        left: 0,
        top: 0,
        width: 0,
        height: 0
      },

      /**
       * Indicates how much the scroll offset will be changed on after the next render.
       * This is needed to retain the viewport position visually even after the scroll content size is changed.
       * When scroll content size is changed, it calcurate how much we should modify its scroll position
       * and set the value to `deltaScrollOffset`. Then, it will be applied actual DOM element
       * after VNode is patched (in updated hook).
       */
      deltaScrollOffset: null as { left: number; top: number } | null
    }
  },

  computed: {
    scaledSize(): { width: number; height: number } {
      return {
        width: this.width * this.scale,
        height: this.height * this.scale
      }
    },

    scrollContentSize(): { width: number; height: number } {
      const renderer = this.rendererSize
      const thresholdWidth = Math.max(0, renderer.width - scrollContentPadding)
      const thresholdHeight = Math.max(
        0,
        renderer.height - scrollContentPadding
      )

      const { width, height } = this.scaledSize

      // If the viewport size is enough smaller than renderer size,
      // the scroll content size is the same as the renderer size so that the viewport will not be scrollable.
      // Otherwise, the scroll content size will be much lager than renderer size to allow scrolling.
      // This is similar behavior with Photoshop.
      return {
        width:
          thresholdWidth > width ? renderer.width : width + thresholdWidth * 2,
        height:
          thresholdHeight > height
            ? renderer.height
            : height + thresholdHeight * 2
      }
    },

    scrollContentStyle(): Record<string, string> {
      const { scrollContentSize: size } = this
      return {
        width: size.width + 'px',
        height: size.height + 'px'
      }
    },

    scrollContentCenter(): { x: number; y: number } {
      const { scrollContentSize: size } = this
      return {
        x: size.width / 2,
        y: size.height / 2
      }
    },

    selectedStyle(): Record<string, string> {
      const { selectedBounds: bounds } = this
      return {
        left: bounds.left + 'px',
        top: bounds.top + 'px',
        width: bounds.width + 'px',
        height: bounds.height + 'px'
      }
    }
  },

  methods: {
    onSelectNode({
      node,
      bounds
    }: {
      node: Element
      bounds: { left: number; top: number; width: number; height: number }
    }): void {
      const viewport = this.$refs.viewport as Vue
      const viewportBounds = viewport.$el.getBoundingClientRect()

      // The bounds are modified by the current scale.
      // To show the selected border with accurate bounds,
      // we need to get original bounds by dividing them by the scale.
      this.selectedBounds = {
        left: (bounds.left - viewportBounds.left) / this.scale,
        top: (bounds.top - viewportBounds.top) / this.scale,
        width: bounds.width / this.scale,
        height: bounds.height / this.scale
      }

      this.$emit('select', node)
    }
  },

  watch: {
    scrollContentCenter(
      { x, y }: { x: number; y: number },
      { x: prevX, y: prevY }: { x: number; y: number }
    ): void {
      // Adjust scroll offset after DOM is rerendered
      // to avoid flickering viewport
      this.deltaScrollOffset = {
        left: x - prevX,
        top: y - prevY
      }
    }
  },

  mounted() {
    const listener = () => {
      const el = this.$el
      const { width, height } = el.getBoundingClientRect()
      this.rendererSize.width = width
      this.rendererSize.height = height
    }

    window.addEventListener('resize', listener)
    listener()
    this.$once('hook:beforeDestroy', () => {
      window.removeEventListener('resize', listener)
    })
  },

  updated() {
    const delta = this.deltaScrollOffset
    if (delta) {
      const el = this.$el
      el.scrollLeft += delta.left
      el.scrollTop += delta.top
      this.deltaScrollOffset = null
    }
  }
})
</script>

<style lang="scss" scoped>
.renderer {
  all: initial;
  overflow: auto;
  display: block;
  height: 100%;
  width: 100%;
}

.renderer-scroll-content {
  position: relative;
}

.renderer-selected {
  position: absolute;
  box-sizing: border-box;
  border: 1px solid #0f2fff;
  pointer-events: none;
}
</style>
