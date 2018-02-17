import { DefineModule, createNamespacedHelpers } from 'vuex'
import { VueFilePayload } from '@/parser/vue-file'
import {
  Template,
  Element,
  addScope as addScopeToTemplate
} from '@/parser/template'
import { ClientConnection } from '@/view/communication'
import { mapValues } from '@/utils'
import { addScope as addScopeToStyle } from '@/parser/style'
import { genStyle } from '@/parser/style-codegen'
import { Prop, Data, ChildComponent } from '@/parser/script'

export interface ScopedDocument {
  template: Template | undefined
  props: Prop[]
  data: Data[]
  childComponents: ChildComponent[]
  styleCode: string
}

interface ProjectState {
  documents: Record<string, VueFilePayload>
  currentUri: string | undefined
  selectedPath: number[]
}

interface ProjectGetters {
  scopedDocuments: Record<string, ScopedDocument>
  currentDocument: VueFilePayload | undefined
  currentScopedDocument: ScopedDocument | undefined
}

interface ProjectActions {
  init: ClientConnection
  select: Element
}

interface ProjectMutations {
  setDocuments: Record<string, VueFilePayload>
  changeDocument: string
  select: Element
}

export const projectHelpers = createNamespacedHelpers<
  ProjectState,
  ProjectGetters,
  ProjectMutations,
  ProjectActions
>('project')

let connection: ClientConnection

export const project: DefineModule<
  ProjectState,
  ProjectGetters,
  ProjectMutations,
  ProjectActions
> = {
  namespaced: true,

  state: () => ({
    documents: {},
    currentUri: undefined,
    selectedPath: []
  }),

  getters: {
    scopedDocuments(state) {
      return mapValues(state.documents, doc => {
        return {
          template:
            doc.template && addScopeToTemplate(doc.template, doc.scopeId),
          props: doc.props,
          data: doc.data,
          childComponents: doc.childComponents,
          styleCode: doc.styles.reduce((acc, style) => {
            return acc + '\n' + genStyle(addScopeToStyle(style, doc.scopeId))
          }, '')
        }
      })
    },

    currentDocument(state) {
      if (!state.currentUri) {
        return undefined
      }
      return state.documents[state.currentUri]
    },

    currentScopedDocument(state, getters) {
      if (!state.currentUri) {
        return undefined
      }
      return getters.scopedDocuments[state.currentUri]
    }
  },

  actions: {
    init({ commit }, conn) {
      connection = conn
      connection.onMessage(data => {
        switch (data.type) {
          case 'InitProject':
            commit('setDocuments', data.vueFiles)
            break
          case 'ChangeDocument':
            commit('changeDocument', data.uri)
            break
          default: // Do nothing
        }
      })
    },

    select({ commit, getters }, node) {
      const current = getters.currentDocument
      if (!current) return

      connection.send({
        type: 'SelectNode',
        uri: current.uri,
        path: node.path
      })
      commit('select', node)
    }
  },

  mutations: {
    setDocuments(state, vueFiles) {
      state.documents = vueFiles
    },

    changeDocument(state, uri) {
      state.currentUri = uri
      state.selectedPath = []
    },

    select(state, node) {
      state.selectedPath = node.path
    }
  }
}
