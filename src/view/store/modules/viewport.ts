import { DefineModule, createNamespacedHelpers } from 'vuex'

interface ViewportState {
  width: number
  height: number
}

interface ViewportActions {
  resize: {
    width: number
    height: number
  }
}

interface ViewportMutations {
  resize: {
    width: number
    height: number
  }
}

export const viewportHelpers = createNamespacedHelpers<
  ViewportState,
  {},
  ViewportMutations,
  ViewportActions
>('viewport')

export const viewport: DefineModule<
  ViewportState,
  {},
  ViewportMutations,
  ViewportActions
> = {
  namespaced: true,

  state: () => ({
    width: 600,
    height: 800
  }),

  actions: {
    resize({ commit }, payload) {
      commit('resize', payload)
    }
  },

  mutations: {
    resize(state, { width, height }) {
      state.width = width
      state.height = height
    }
  }
}
