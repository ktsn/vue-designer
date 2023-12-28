import { nextTick } from 'vue'
import { store as createStore, createMapper } from 'sinai'
import rootModule from './modules'
import { CommunicationClient } from '../communication/client'
import { StyleMatcher } from './style-matcher'
import { BoundsCalculator } from './bounds-calculator'
import { ResolverType } from '../../server/resolver'
import { MutatorType } from '../../server/mutator'
import { SubjectType } from '../../server/subject-type'

export const store = createStore(rootModule, {
  strict: import.meta.env.MODE !== 'production',
})
export const mapper = createMapper<typeof store>()

const ws = new WebSocket(`ws://localhost:${location.port}/api`)
const client = new CommunicationClient<ResolverType, MutatorType, SubjectType>({
  ws,
})
const styleMatcher = new StyleMatcher()
const boundsCalculator = new BoundsCalculator()

store.actions.project.init({
  client,
  styleMatcher,
})

store.actions.guide.init(boundsCalculator)

store.subscribe((path: any) => {
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
    'viewport.zoom',
  ]

  const shouldReset = [
    'project.setDocuments',
    'project.removeDocument',
    'project.changeActiveDocument',
  ]

  const pathStr = path.join('.')
  const guideActions = store.actions.guide

  if (mayRelayout.indexOf(pathStr) >= 0) {
    nextTick(guideActions.calculate)
  } else if (shouldReset.indexOf(pathStr) >= 0) {
    nextTick(guideActions.deselect)
  }
})
