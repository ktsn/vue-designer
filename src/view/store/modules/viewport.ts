import { DefineModule, createNamespacedHelpers } from 'vuex'

interface ViewportState {
  width: number
  height: number
  window: {
    width: number
    height: number
  }
}

interface ViewportGetters {
  scroller: {
    width: number
    height: number
  }
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
  setWindowSize: {
    width: number
    height: number
  }
}

const scrollerPadding = 100

export const viewportHelpers = createNamespacedHelpers<
  ViewportState,
  ViewportGetters,
  ViewportMutations,
  ViewportActions
>('viewport')

export const viewport: DefineModule<
  ViewportState,
  ViewportGetters,
  ViewportMutations,
  ViewportActions
> = {
  namespaced: true,

  state: () => ({
    width: 600,
    height: 800,
    window: {
      width: 0,
      height: 0
    }
  }),

  getters: {
    scroller(state) {
      const { window } = state

      // If the viewport size is enough smaller than window size,
      // the scroller size is the same as the window size so that the viewport will not be scrollable.
      // Otherwise, the scroller size will be much lager than window size to allow scrolling.
      // This is similar behavior with Photoshop.
      return {
        width:
          window.width - scrollerPadding > state.width
            ? window.width
            : state.width + (window.width - scrollerPadding) * 2,
        height:
          window.height - scrollerPadding > state.height
            ? window.height
            : state.height + (window.height - scrollerPadding) * 2
      }
    }
  },

  actions: {
    resize({ commit }, payload) {
      commit('resize', payload)
    }
  },

  mutations: {
    resize(state, { width, height }) {
      state.width = width
      state.height = height
    },

    setWindowSize(state, { width, height }) {
      state.window.width = width
      state.window.height = height
    }
  }
}
