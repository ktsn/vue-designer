import { DefineModule, createNamespacedHelpers } from 'vuex'
import { minmax } from '@/utils'

interface ViewportState {
  width: number
  height: number
  scale: number
}

interface ViewportActions {
  resize: {
    width: number
    height: number
  }
  zoom: number
}

interface ViewportMutations {
  resize: {
    width: number
    height: number
  }
  zoom: number
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
    height: 800,
    scale: 1.0
  }),

  actions: {
    resize({ commit }, payload) {
      commit('resize', payload)
    },

    zoom({ commit }, payload) {
      commit('zoom', payload)
    }
  },

  mutations: {
    resize(state, { width, height }) {
      const min = 10
      state.width = Math.max(min, Math.floor(width))
      state.height = Math.max(min, Math.floor(height))
    },

    zoom(state, scale) {
      const max = 5
      const min = 0.1
      state.scale = minmax(min, scale, max)
    }
  }
}
