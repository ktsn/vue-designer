<template>
  <div class="renderer" @click="$emit('select')">
    <div class="renderer-scroller" :style="scrollerStyle">
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
    },
    scrollerWidth: {
      type: Number,
      required: true
    },
    scrollerHeight: {
      type: Number,
      required: true
    }
  },

  computed: {
    scrollerStyle(): Record<string, string> {
      return {
        width: this.scrollerWidth + 'px',
        height: this.scrollerHeight + 'px'
      }
    },

    scrollerCenter(): { x: number; y: number } {
      return {
        x: this.scrollerWidth / 2,
        y: this.scrollerHeight / 2
      }
    }
  },

  watch: {
    scrollerCenter(
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

.renderer-scroller {
  position: relative;
}
</style>
