<template>
  <div>
    <div class="page-layout">
      <div class="page-layout-renderer">
        <Renderer
          v-if="renderingDocument"
          :document="renderingDocument"
          :scope="scope"
          :width="width"
          :height="height"
          :scale="scale"
          :shared-style="sharedStyle"
          @select="onSelectNode"
          @dragover="onDragOver"
          @add="applyDraggingElement"
          @resize="resize"
          @zoom="zoom"
        />
      </div>

      <div class="vd-reset page-layout-toolbar">
        <Toolbar
          :width="width"
          :height="height"
          :scale="scale"
          @resize="resize"
          @zoom="zoom"
        />
      </div>
    </div>

    <div
      v-if="document"
      :class="{ open: openPane }"
      class="vd-reset information-pane"
    >
      <p class="information-pane-title">{{ documentName }}</p>

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
            <p v-else class="not-found">Not found</p>
          </div>
        </div>

        <div class="information-pane-item">
          <ScopeInformation
            :scope="scope"
            @update-prop="updatePropValue"
            @update-data="updateDataValue"
          >
            <p slot="not-found-prop" class="not-found">Not found</p>
            <p slot="not-found-data" class="not-found">Not found</p>
          </ScopeInformation>
        </div>

        <div class="information-pane-item">
          <ComponentCatalog
            :components="catalog"
            @dragstart="startDragging"
            @dragend="endDragging"
          />
        </div>
      </div>

      <button
        :aria-pressed="openPane"
        class="information-pane-toggle"
        type="button"
        aria-label="Toggle information pane"
        @click="openPane = !openPane"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Renderer from './Renderer.vue'
import ScopeInformation from './ScopeInformation.vue'
import StyleInformation from './StyleInformation.vue'
import ComponentCatalog from './ComponentCatalog.vue'
import Toolbar from './Toolbar.vue'
import { DraggingPlace, ScopedDocument } from '../store/modules/project/types'
import { mapper } from '../store'
import { TEElement } from '../../parser/template/types'

const projectMapper = mapper.module('project')
const viewportMapper = mapper.module('viewport')
const guideMapper = mapper.module('guide')

export default defineComponent({
  name: 'PageMain',

  components: {
    Renderer,
    ScopeInformation,
    StyleInformation,
    ComponentCatalog,
    Toolbar,
  },

  data() {
    return {
      openPane: false,
    }
  },

  computed: {
    ...projectMapper.mapState({
      uri: 'currentUri',
      selectedPath: 'selectedPath',
      matchedRules: 'matchedRules',
      sharedStyle: 'sharedStyle',
    }),

    ...viewportMapper.mapState(['width', 'height', 'scale']),

    ...projectMapper.mapGetters({
      document: 'currentDocument',
      scope: 'currentScope',
      documentName: 'currentDocumentName',
      renderingDocument: 'currentRenderingDocument',
      scopedDocuments: 'scopedDocuments',
    }),

    catalog(): ScopedDocument[] {
      return Object.keys(this.scopedDocuments).map(
        (key) => this.scopedDocuments[key],
      )
    },
  },

  methods: {
    ...projectMapper.mapActions([
      'startDragging',
      'endDragging',
      'setDraggingPlace',
      'select',
      'applyDraggingElement',
      'addDeclaration',
      'removeDeclaration',
      'updateDeclaration',
    ]),

    ...projectMapper.mapMutations(['updatePropValue', 'updateDataValue']),

    ...viewportMapper.mapActions(['resize', 'zoom']),

    ...guideMapper.mapActions(['selectTarget', 'deselect']),

    onSelectNode(
      data:
        | {
            ast: TEElement
            element: HTMLElement
            viewport: HTMLElement
          }
        | undefined,
    ): void {
      this.select(data ? data.ast : undefined)
      if (data) {
        this.selectTarget(data.element, data.viewport)
      } else {
        this.deselect()
      }
    },

    onDragOver(params: { path: number[]; place: DraggingPlace }): void {
      this.setDraggingPlace(params)
    },
  },
})
</script>

<style scoped>
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
  background-color: var(--vd-color-bg-pane);
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
  transform: translateX(100%);
  transition: transform 400ms cubic-bezier(0.19, 1, 0.22, 1);
}

.information-pane.open {
  transform: translateX(0);
}

.information-pane-title {
  margin: 0;
  padding: 13px 15px 0;
  font-size: var(--vd-font-size-large);
}

.information-pane-scroller {
  overflow-y: scroll;
  height: 100%;
}

.information-pane-item:not(:first-child) {
  border-top: 1px solid var(--vd-border-color);
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
  background-color: var(--vd-color-accent);
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
  color: var(--vd-color-text-weakest);
}
</style>
