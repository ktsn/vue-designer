import { DefineModule, createNamespacedHelpers } from 'vuex'
import { VueFile } from 'parser/vue-file'
import { Template } from 'parser/template'
import { Prop, Data } from 'parser/script'
import { ClientConnection } from 'view/communication'

interface ProjectState {
  document: VueFile | undefined
}

interface ProjectGetters {
  template: Template | undefined
  props: Prop[]
  data: Data[]
  styles: string[]
}

interface ProjectActions {
  init: ClientConnection
}

interface ProjectMutations {
  setDocument: VueFile
}

export const projectHelpers = createNamespacedHelpers<
  ProjectState,
  ProjectGetters,
  ProjectMutations,
  ProjectActions
>('project')

export const project: DefineModule<
  ProjectState,
  ProjectGetters,
  ProjectMutations,
  ProjectActions
> = {
  namespaced: true,

  state: {
    document: undefined
  },

  getters: {
    template(state) {
      return state.document && state.document.template
    },

    props(state) {
      return state.document ? state.document.props : []
    },

    data(state) {
      return state.document ? state.document.data : []
    },

    styles(state) {
      return state.document ? state.document.styles : []
    }
  },

  actions: {
    init({ commit }, connection) {
      connection.onMessage(data => {
        switch (data.type) {
          case 'InitDocument':
            commit('setDocument', data.vueFile)
            break
          default: // Do nothing
        }
      })
    }
  },

  mutations: {
    setDocument(state, vueFile) {
      state.document = vueFile
    }
  }
}
