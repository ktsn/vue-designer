<template>
  <ul class="catalog-list">
    <li
      class="catalog-item"
      v-for="c in components" :key="c.uri"
      draggable="true"
      @dragstart="onDragStart($event, c)"
      @dragend="onDragEnd()"
    >
      <div class="catalog-item-inner">
        <div class="catalog-item-layout">
          <div class="catalog-preview">
            <ComponentCatalogPreview :component="c" />
          </div>
          <p class="catalog-component-name">{{ c.displayName }}</p>
        </div>
      </div>
    </li>
  </ul>
</template>

<script lang="ts">
import Vue from 'vue'
import ComponentCatalogPreview from './ComponentCatalogPreview.vue'
import { ScopedDocument } from '../store/modules/project'

export default Vue.extend({
  name: 'ComponentCatalog',

  components: {
    ComponentCatalogPreview
  },

  props: {
    components: {
      type: Array as () => ScopedDocument[],
      required: true
    }
  },

  methods: {
    onDragStart(event: DragEvent, component: ScopedDocument): void {
      const dt = event.dataTransfer
      dt.effectAllowed = 'copy'
      this.$emit('dragstart', component.uri)
    },

    onDragEnd(): void {
      this.$emit('dragend')
    }
  }
})
</script>

<style lang="scss" scoped>
.catalog-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.catalog-item {
  padding: 0 15px;
  position: relative;
}

.catalog-item-inner {
  padding: 10px 0;
  border-top: 1px solid #dfdfdf;
}

.catalog-item:first-child .catalog-item-inner {
  border-top-width: 0;
}

.catalog-item-layout {
  display: table;
  table-layout: fixed;
  box-sizing: border-box;
  width: 100%;
}

.catalog-preview {
  display: table-cell;
  padding-right: 15px;
  width: 50px;
  vertical-align: middle;
}

.catalog-component-name {
  display: table-cell;
  font-weight: bold;
  font-size: rem(12);
  text-align: left;
  vertical-align: middle;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
</style>
