<template>
  <div class="renderer" @click="$emit('select')">
    <div class="renderer-scroll-content" :style="scrollContentStyle">
      <Viewport :width="width" :height="height" @resize="$emit('resize', arguments[0])">
        <VueComponent
          :uri="document.uri"
          :template="document.template"
          :props="document.props"
          :data="document.data"
          :child-components="document.childComponents"
          :styles="document.styleCode"
          @select="$emit('select', arguments[0])"
          @dragover="$emit('dragover', arguments[0])"
          @add="$emit('add')"
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
      rendererSize: {
        width: 0,
        height: 0
      }
    }
  },

  computed: {
    scrollContentSize(): { width: number; height: number } {
      const renderer = this.rendererSize

      // If the viewport size is enough smaller than renderer size,
      // the scroll content size is the same as the renderer size so that the viewport will not be scrollable.
      // Otherwise, the scroll content size will be much lager than renderer size to allow scrolling.
      // This is similar behavior with Photoshop.
      return {
        width:
          renderer.width - scrollContentPadding > this.width
            ? renderer.width
            : this.width + (renderer.width - scrollContentPadding) * 2,
        height:
          renderer.height - scrollContentPadding > this.height
            ? renderer.height
            : this.height + (renderer.height - scrollContentPadding) * 2
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
    }
  },

  watch: {
    scrollContentCenter(
      { x, y }: { x: number; y: number },
      { x: prevX, y: prevY }: { x: number; y: number }
    ): void {
      const el = this.$el

      // Ajust scroll offset after DOM is rerendered
      // to avoid flickering viewport
      requestAnimationFrame(() => {
        el.scrollLeft = el.scrollLeft + (x - prevX)
        el.scrollTop = el.scrollTop + (y - prevY)
      })
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
</style>
