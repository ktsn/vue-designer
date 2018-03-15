import Vue from 'vue'
import { Store, install as vuexInstall } from 'vuex'
import modules from './modules'
import { ClientConnection } from '../communication'
import { StyleMatcher } from './style-matcher'

Vue.use(vuexInstall)

export const store = new Store({
  modules
})

const connection = new ClientConnection()
const styleMatcher = new StyleMatcher()
connection.connect(location.port)
store.dispatch('project/init', {
  connection,
  styleMatcher
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
