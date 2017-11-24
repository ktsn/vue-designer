import Vue from 'vue'
import App from './App.vue'

export interface View {
  getElement(): Element
  destroy(): void
  serialize(): any
}

export function createView(): View {
  const vm = new Vue({
    render: h => h(App)
  }).$mount()

  return {
    getElement() {
      return vm.$el
    },

    destroy() {
      vm.$destroy()
      vm.$el.remove()
    },

    serialize() {}
  }
}
