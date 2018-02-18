<template>
  <div class="preview-viewport">
    <div class="preview-content">
      <VueComponent
        :uri="component.uri"
        :template="component.template"
        :styles="component.styleCode"
        :props="component.props"
        :data="component.data"
        :child-components="component.childComponents"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import VueComponent from './VueComponent.vue'
import { ScopedDocument } from '../store/modules/project'

export default Vue.extend({
  name: 'ComponentCatalogPreview',

  components: {
    VueComponent
  },

  props: {
    component: {
      type: Object as () => ScopedDocument,
      required: true
    }
  }
})
</script>

<style lang="scss" scoped>
.preview-viewport {
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
  border: 1px solid #dfdfdf;
  background-color: #fff;
  height: 50px;
  width: 50px;
}

.preview-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 500px;
  transform: scale(0.25);
  transform-origin: left top;
}
</style>
