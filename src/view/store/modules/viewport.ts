import { Mutations, Actions, module } from 'sinai'
import { minmax } from '@/utils'

class ViewportState {
  width = 600
  height = 800
  scale = 1.0
}

class ViewportMutations extends Mutations<ViewportState>() {
  resize({ width, height }: { width: number; height: number }): void {
    const min = 10
    const { state } = this
    state.width = Math.max(min, Math.floor(width))
    state.height = Math.max(min, Math.floor(height))
  }

  zoom(scale: number) {
    const max = 5
    const min = 0.1
    const { state } = this
    state.scale = minmax(min, scale, max)
  }
}

class ViewportActions extends Actions<ViewportState, ViewportMutations>() {
  resize(payload: { width: number; height: number }): void {
    this.mutations.resize(payload)
  }

  zoom(payload: number): void {
    this.mutations.zoom(payload)
  }
}

export const viewport = module({
  state: ViewportState,
  mutations: ViewportMutations,
  actions: ViewportActions
})
