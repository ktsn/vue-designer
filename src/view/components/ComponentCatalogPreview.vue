<template>
  <div class="preview-viewport">
    <div class="preview-content">
      <VueComponent
        :uri="component.uri"
        :template="component.template"
        :styles="component.styleCode"
        :scope="scope"
        :child-components="component.childComponents"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import VueComponent from './VueComponent.vue'
import { ScopedDocument, DocumentScope } from '../store/modules/project/types'

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
  },

  computed: {
    scope(): DocumentScope {
      const scope: DocumentScope = { props: {}, data: {} }

      this.component.props.forEach(prop => {
        scope.props[prop.name] = {
          type: prop.type,
          value: prop.default
        }
      })

      this.component.data.forEach(d => {
        scope.data[d.name] = {
          type: null,
          value: d.default
        }
      })

      return scope
    }
  }
})
</script>

<style scoped>
.preview-viewport {
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
  border: 1px solid var(--vd-border-color);
  background-color: #fff;
  height: 0;
  width: 100%;
  padding-bottom: 100%;
}

.preview-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 200%;
  transform: scale(0.5);
  transform-origin: left top;
}
</style>
