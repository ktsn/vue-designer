<template>
  <div class="renderer" @click="$emit('select')">
    <Viewport
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
        @select="$emit('select', arguments[0])"
        @dragover="$emit('dragover', arguments[0])"
        @add="$emit('add')"
      />
    </Viewport>
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
    scale: {
      type: Number,
      required: true
    }
  }
})
</script>

<style lang="scss" scoped>
.renderer {
  all: initial;
  overflow: auto;
  display: block;
  position: relative;
  height: 100%;
  width: 100%;
}
</style>
