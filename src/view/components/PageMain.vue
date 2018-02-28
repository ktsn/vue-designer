<template>
  <div>
    <Renderer
      v-if="renderingDocument"
      :document="renderingDocument"
      @select="select"
      @dragover="setDraggingPlace"
      @add="applyDraggingElement"
    />

    <div v-if="document" class="information-pane" :class="{ open: openPane }">
      <div class="information-pane-scroller">
        <div v-if="selectedPath.length === 0" class="scope-information">
          <ScopeInformation :props="document.props" :data="document.data" />
        </div>

        <div v-else class="style-information">
          <p class="style-information-title">Node Styles</p>
          <div class="style-information-list">
            <StyleInformation v-if="matchedRules.length > 0" :rules="matchedRules" />
            <p class="style-not-found" v-else>Not found</p>
          </div>
        </div>

        <div class="component-catalog">
          <ComponentCatalog
            :components="catalog"
            @dragstart="startDragging"
            @dragend="endDragging"
          />
        </div>
      </div>

      <button
        class="information-pane-toggle"
        type="button"
        @click="openPane = !openPane"
      >T</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Renderer from './Renderer.vue'
import ScopeInformation from './ScopeInformation.vue'
import StyleInformation from './StyleInformation.vue'
import ComponentCatalog from './ComponentCatalog.vue'
import { projectHelpers, ScopedDocument } from '../store/modules/project'

export default Vue.extend({
  name: 'PageMain',

  components: {
    Renderer,
    ScopeInformation,
    StyleInformation,
    ComponentCatalog
  },

  data() {
    return {
      openPane: false
    }
  },

  computed: {
    ...projectHelpers.mapState({
      uri: 'currentUri',
      selectedPath: 'selectedPath',
      matchedRules: 'matchedRules'
    }),

    ...projectHelpers.mapGetters({
      document: 'currentDocument',
      renderingDocument: 'currentRenderingDocument',
      scopedDocuments: 'scopedDocuments'
    }),

    catalog(): ScopedDocument[] {
      return Object.keys(this.scopedDocuments).map(
        key => this.scopedDocuments[key]
      )
    }
  },

  methods: projectHelpers.mapActions([
    'startDragging',
    'endDragging',
    'setDraggingPlace',
    'select',
    'applyDraggingElement'
  ])
})
</script>

<style lang="scss" scoped>
.information-pane {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 330px;
  background-color: #f5f5f5;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.3);
  transform: translateX(100%);
  transition: transform 400ms cubic-bezier(0.19, 1, 0.22, 1);

  &.open {
    transform: translateX(0);
  }
}

.information-pane-scroller {
  overflow-y: scroll;
  height: 100%;
}

.information-pane-toggle {
  position: absolute;
  right: 100%;
  bottom: 0;
  padding: 0;
  border-width: 0;
  background: none;
  font-size: inherit;
}

.style-information {
  padding-top: 10px;
}

.style-information-title {
  margin: 0;
  padding: 0 15px 0 13px;
  font-weight: bold;
}

.style-information-list {
  padding: 8px 15px 13px 13px;
}

.style-not-found {
  margin: 0;
  color: #888;
}

.component-catalog {
  border-top: 1px solid #ccc;
}
</style>
