<template>
  <div>
    <div class="page-layout">
      <div class="page-layout-renderer">
        <Renderer
          v-if="renderingDocument"
          :document="renderingDocument"
          :selected-path="selectedPath"
          :width="width"
          :height="height"
          :scale="scale"
          @select="select"
          @dragover="setDraggingPlace"
          @add="applyDraggingElement"
          @resize="onResize"
          @zoom="zoom"
        />
      </div>

      <div class="page-layout-toolbar">
        <Toolbar
          :width="width"
          :height="height"
          :scale="scale"
          @resize="onResize"
          @zoom="zoom"
        />
      </div>
    </div>

    <div v-if="document" class="information-pane" :class="{ open: openPane }">
      <div class="information-pane-scroller">
        <div
          v-if="selectedPath.length > 0"
          class="style-information-wrapper information-pane-item"
        >
          <p class="style-information-title">Node Styles</p>
          <div class="style-information-list">
            <StyleInformation
              v-if="matchedRules.length > 0"
              :rules="matchedRules"
              @add-declaration="addDeclaration"
              @remove-declaration="removeDeclaration"
              @update-declaration="updateDeclaration"
            />
            <p class="not-found" v-else>Not found</p>
          </div>
        </div>

        <div class="information-pane-item">
          <ScopeInformation :props="document.props" :data="document.data">
            <p class="not-found" slot="not-found-prop">Not found</p>
            <p class="not-found" slot="not-found-data">Not found</p>
          </ScopeInformation>
        </div>

        <div class="information-pane-item">
          <ComponentCatalog
            :components="catalog"
            @dragstart="onStartDragging"
            @dragend="endDragging"
          />
        </div>
      </div>

      <button
        class="information-pane-toggle"
        type="button"
        aria-label="Toggle information pane"
        :aria-pressed="String(openPane)"
        @click="openPane = !openPane"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Renderer from './Renderer.vue'
import ScopeInformation from './ScopeInformation.vue'
import StyleInformation from './StyleInformation.vue'
import ComponentCatalog from './ComponentCatalog.vue'
import Toolbar from './Toolbar.vue'
import { projectHelpers, ScopedDocument } from '../store/modules/project'
import { viewportHelpers } from '@/view/store/modules/viewport'

export default Vue.extend({
  name: 'PageMain',

  components: {
    Renderer,
    ScopeInformation,
    StyleInformation,
    ComponentCatalog,
    Toolbar
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

    ...viewportHelpers.mapState(['width', 'height', 'scale']),

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

  methods: {
    ...projectHelpers.mapActions([
      'startDragging',
      'endDragging',
      'setDraggingPlace',
      'select',
      'applyDraggingElement',
      'addDeclaration',
      'removeDeclaration',
      'updateDeclaration'
    ]),

    ...viewportHelpers.mapActions(['resize', 'zoom']),

    onStartDragging(uri: string): void {
      // Deselect to avoid showing incorrect bounds
      this.select(undefined)

      this.startDragging(uri)
    },

    onResize(size: { width: number; height: number }): void {
      // Deselect to avoid showing incorrect bounds
      this.select(undefined)

      this.resize(size)
    }
  }
})
</script>

<style lang="scss" scoped>
.page-layout-renderer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 32px;
}

.page-layout-toolbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 32px;
}

.information-pane {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 330px;
  background-color: #f5f5f5;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
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

.information-pane-item:not(:first-child) {
  border-top: 1px solid #ccc;
}

.information-pane-toggle {
  position: absolute;
  right: 100%;
  top: 0;
  padding: 0;
  margin: 5px;
  height: 30px;
  width: 30px;
  border-width: 0;
  border-radius: 3px;
  background-color: #666;
  font-size: inherit;
  outline: none;
  cursor: pointer;
  transition: background-color 80ms ease-out;
}

.information-pane-toggle:hover {
  background-color: #24b600;
}

.information-pane-toggle::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  margin-top: -8px;
  margin-left: -6px;
  border: 10px solid transparent;
  border-top-width: 7px;
  border-bottom-width: 7px;
  border-left-width: 0;
  border-right-color: #fff;
}

.information-pane-toggle[aria-pressed='true']::before {
  margin-left: -4px;
  transform: rotate(180deg);
}

.style-information-wrapper {
  padding-top: 13px;
}

.style-information-title {
  margin: 0;
  padding: 0 15px 0 13px;
  font-weight: bold;
}

.style-information-list {
  padding: 8px 15px 13px 13px;
}

.not-found {
  margin: 0;
  color: #888;
}
</style>
