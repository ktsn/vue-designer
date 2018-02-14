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

interface ProjectState {
  documents: Record<string, VueFilePayload>
  currentUri: string | undefined
  selectedPath: number[]
}

interface ProjectGetters {
  currentDocument: VueFilePayload | undefined
  scopedTemplates: Record<string, Template | undefined>
  scopedStyles: Record<string, string>
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
    currentDocument(state) {
      if (!state.currentUri) {
        return undefined
      }
      return state.documents[state.currentUri]
    },

    scopedTemplates(state) {
      return mapValues(state.documents, doc => {
        if (!doc.template) return undefined
        return addScopeToTemplate(doc.template, doc.scopeId)
      })
    },

    scopedStyles(state) {
      return mapValues(state.documents, doc => {
        return genStyle(addScopeToStyle(doc.styles, doc.scopeId))
      })
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
