import Vue from 'vue'
import { Store, install as vuexInstall } from 'vuex'
import modules from './modules'
import { ClientConnection } from '../communication'

Vue.use(vuexInstall)

export const store = new Store({
  modules
})

const connection = new ClientConnection()
connection.connect(location.port)
connection.onMessage(data => {
  switch (data.type) {
    case 'InitDocument':
      store.commit('project/setDocument', data.vueFile)
      break
    default: // Do nothing
  }
})

declare const module: any
if (module.hot) {
  module.hot.accept(['./modules'], () => {
    const newModules = require('./modules').default
    store.hotUpdate({
      modules: newModules
    })
  })
}
