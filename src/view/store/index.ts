import Vue from 'vue'
import { store as createStore, install, createMapper } from 'sinai'
import rootModule from './modules'
import { ClientConnection } from '../communication'
import { StyleMatcher } from './style-matcher'
import { BoundsCalculator } from './bounds-calculator'

Vue.use(install)

export const store = createStore(rootModule, {
  strict: process.env.NODE_ENV !== 'production'
})
export const mapper = createMapper<typeof store>()

const connection = new ClientConnection()
const styleMatcher = new StyleMatcher()
const boundsCalculator = new BoundsCalculator()

connection.connect(location.port)

store.actions.project.init({
  connection,
  styleMatcher
})

store.actions.guide.init(boundsCalculator)

declare const module: any
if (module.hot) {
  module.hot.accept(['./modules'], () => {
    const newRootModule = require('./modules').default
    store.hotUpdate(newRootModule)
  })
}
