import Vue from 'vue'
import { store as createStore, install, createMapper } from 'sinai'
import rootModule from './modules'
import { CommunicationClient } from '../communication/client'
import { StyleMatcher } from './style-matcher'
import { BoundsCalculator } from './bounds-calculator'
import { ResolverType } from '@/server/resolver'
import { MutatorType } from '@/server/mutator'
import { SubjectType } from '@/server/subject-type'

Vue.use(install)

export const store = createStore(rootModule, {
  strict: process.env.NODE_ENV !== 'production'
})
export const mapper = createMapper<typeof store>()

const ws = new WebSocket(`ws://localhost:${location.port}/api`)
const client = new CommunicationClient<ResolverType, MutatorType, SubjectType>({
  ws
})
const styleMatcher = new StyleMatcher()
const boundsCalculator = new BoundsCalculator()

store.actions.project.init({
  client,
  styleMatcher
})

store.actions.guide.init(boundsCalculator)

store.subscribe(path => {
  const mayRelayout = [
    'project.setDocument',
    'project.addElement',
    'project.addChildComponent',
    'project.setSharedStyle',
    'project.refreshScope',
    'project.cleanScope',
    'project.updatePropValue',
    'project.updateDataValue',
    'viewport.resize',
    'viewport.zoom'
  ]

  const shouldReset = [
    'project.setDocuments',
    'project.removeDocument',
    'project.changeActiveDocument'
  ]

  const pathStr = path.join('.')
  const guideActions = store.actions.guide

  if (mayRelayout.indexOf(pathStr) >= 0) {
    Vue.nextTick(guideActions.calculate)
  } else if (shouldReset.indexOf(pathStr) >= 0) {
    Vue.nextTick(guideActions.deselect)
  }
})

declare const module: any
if (module.hot) {
  module.hot.accept(['./modules'], () => {
    const newRootModule = require('./modules').default
    store.hotUpdate(newRootModule)
  })
}
