<template>
  <ul class="catalog-list">
    <li
      v-for="c in components"
      :key="c.uri"
      class="catalog-item"
      draggable="true"
      @dragstart="onDragStart($event, c)"
      @dragend="onDragEnd()"
    >
      <div class="catalog-preview">
        <ComponentCatalogPreview :component="c" />
      </div>
      <p class="catalog-component-name">{{ c.displayName }}</p>
    </li>
  </ul>
</template>

<script lang="ts">
import Vue from 'vue'
import ComponentCatalogPreview from './ComponentCatalogPreview.vue'
import { ScopedDocument } from '../store/modules/project/types'

export default Vue.extend({
  name: 'ComponentCatalog',

  components: {
    ComponentCatalogPreview,
  },

  props: {
    components: {
      type: Array as () => ScopedDocument[],
      required: true,
    },
  },

  methods: {
    onDragStart(event: DragEvent, component: ScopedDocument): void {
      const dt = event.dataTransfer
      if (dt) {
        dt.effectAllowed = 'copy'
        this.$emit('dragstart', component.uri)
      }
    },

    onDragEnd(): void {
      this.$emit('dragend')
    },
  },
})
</script>

<style scoped>
.catalog-list {
  display: flex;
  flex-wrap: wrap;
  margin: 0;
  padding: 7.5px;
  list-style: none;
}

.catalog-item {
  padding: 7.5px;
  width: 50%;
  box-sizing: border-box;
  position: relative;
}

.catalog-item:first-child .catalog-item-inner {
  border-top-width: 0;
}

.catalog-preview {
  width: 100%;
}

.catalog-component-name {
  margin-top: 5px;
  margin-bottom: 0;
  font-size: var(--vd-font-size);
  text-align: center;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
</style>
