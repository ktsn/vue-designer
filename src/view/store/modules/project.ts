import assert from 'assert'
import Vue from 'vue'
import { DefineModule, createNamespacedHelpers } from 'vuex'
import { VueFilePayload } from '@/parser/vue-file'
import { Template, Element } from '@/parser/template/types'
import {
  addScope as addScopeToTemplate,
  insertNode,
  getNode
} from '@/parser/template/manipulate'
import { RuleForPrint, DeclarationUpdater } from '@/parser/style/types'
import { addScope as addScopeToStyle } from '@/parser/style/manipulate'
import { genStyle } from '@/parser/style/codegen'
import { Prop, Data, ChildComponent } from '@/parser/script/types'
import { ClientConnection } from '@/view/communication'
import { mapValues, clone } from '@/utils'

export interface ScopedDocument {
  uri: string
  displayName: string
  template: Template | undefined
  props: Prop[]
  data: Data[]
  childComponents: ChildComponent[]
  styleCode: string
}

export type DraggingPlace = 'before' | 'after' | 'first' | 'last'

export interface ProjectState {
  documents: Record<string, VueFilePayload>
  currentUri: string | undefined
  draggingUri: string | undefined
  selectedPath: number[]
  draggingPath: number[]
  matchedRules: RuleForPrint[]
}

interface ProjectGetters {
  scopedDocuments: Record<string, ScopedDocument>
  currentDocument: VueFilePayload | undefined
  currentRenderingDocument: ScopedDocument | undefined
  draggingScopedDocument: ScopedDocument | undefined
  localNameOfDragging: string | undefined
  nodeOfDragging: Element | undefined
}

interface ProjectActions {
  init: ClientConnection
  select: Element | undefined
  applyDraggingElement: undefined
  startDragging: string
  endDragging: undefined
  setDraggingPlace: { path: number[]; place: DraggingPlace }
  updateDeclaration: {
    path: number[]
    prop?: string
    value?: string
  }
}

interface ProjectMutations {
  setDocuments: Record<string, VueFilePayload>
  changeDocument: string
  select: number[]
  addElement: { path: number[]; node: Element }
  addChildComponent: ChildComponent
  setDraggingUri: string | undefined
  setDraggingPath: number[]
  setMatchedRules: RuleForPrint[]
  updateMachedRuleDeclaration: DeclarationUpdater
}

export const projectHelpers = createNamespacedHelpers<
  ProjectState,
  ProjectGetters,
  ProjectMutations,
  ProjectActions
>('project')

let connection: ClientConnection
let draggingTimer: any
const draggingInterval = 80

export const project: DefineModule<
  ProjectState,
  ProjectGetters,
  ProjectMutations,
  ProjectActions
> = {
  namespaced: true,

  state: () => ({
    documents: {},
    currentUri: undefined,
    draggingUri: undefined,
    selectedPath: [],
    draggingPath: [],
    matchedRules: []
  }),

  getters: {
    scopedDocuments(state) {
      return mapValues(state.documents, doc => {
        const pathEls = doc.uri.split('/')
        const displayName = pathEls[pathEls.length - 1].replace(/\..*$/, '')

        return {
          uri: doc.uri,
          displayName,
          template:
            doc.template && addScopeToTemplate(doc.template, doc.scopeId),
          props: doc.props,
          data: doc.data,
          childComponents: doc.childComponents,
          styleCode: doc.styles
            .reduce<string[]>((acc, style) => {
              return acc.concat(genStyle(addScopeToStyle(style, doc.scopeId)))
            }, [])
            .join('\n')
        }
      })
    },

    currentDocument(state) {
      if (!state.currentUri) {
        return undefined
      }
      return state.documents[state.currentUri]
    },

    currentRenderingDocument(state, getters) {
      if (!state.currentUri) {
        return undefined
      }

      const doc = getters.scopedDocuments[state.currentUri]
      if (!doc) {
        return undefined
      }

      const dragging = getters.draggingScopedDocument
      const insertInto = state.draggingPath
      const newNode = getters.nodeOfDragging
      if (!doc.template || !dragging || insertInto.length === 0 || !newNode) {
        return doc
      }

      const newChildComponents = getters.localNameOfDragging
        ? doc.childComponents
        : doc.childComponents.concat({
            name: dragging.displayName,
            uri: dragging.uri
          })

      return {
        ...doc,
        childComponents: newChildComponents,
        template: insertNode(doc.template, insertInto, newNode)
      }
    },

    draggingScopedDocument(state, getters) {
      return state.draggingUri
        ? getters.scopedDocuments[state.draggingUri]
        : undefined
    },

    localNameOfDragging(state, getters) {
      const doc = state.currentUri && getters.scopedDocuments[state.currentUri]
      const dragging = getters.draggingScopedDocument

      if (!doc || !dragging) {
        return undefined
      }

      return doc.childComponents.reduce<string | undefined>((acc, comp) => {
        if (acc) return acc

        if (comp.uri === dragging.uri) {
          return comp.name
        }
      }, undefined)
    },

    nodeOfDragging(_state, getters) {
      const dragging = getters.draggingScopedDocument
      if (!dragging) {
        return
      }

      const localName = getters.localNameOfDragging
      return {
        type: 'Element',
        path: [],
        name: localName || dragging.displayName,
        startTag: {
          type: 'StartTag',
          attributes: [],
          selfClosing: false,
          range: [-1, -1]
        },
        endTag: {
          type: 'EndTag',
          range: [-1, -1]
        },
        children: [],
        range: [-1, -1]
      }
    }
  },

  actions: {
    init({ commit }, conn) {
      connection = conn
      connection.onMessage(data => {
        switch (data.type) {
          case 'InitProject':
            commit('setDocuments', data.vueFiles)
            break
          case 'ChangeDocument':
            commit('changeDocument', data.uri)
            break
          case 'MatchRules':
            commit('setMatchedRules', data.rules)
            break
          default: // Do nothing
        }
      })
    },

    select({ commit, getters }, node) {
      const current = getters.currentDocument
      if (!current) return

      const path = node ? node.path : []

      connection.send({
        type: 'SelectNode',
        uri: current.uri,
        path
      })
      commit('select', path)
    },

    applyDraggingElement({ commit, state, getters }) {
      const currentUri = state.currentUri
      const nodeUri = state.draggingUri
      const path = state.draggingPath
      const newNode = getters.nodeOfDragging

      if (!currentUri || !nodeUri || path.length === 0 || !newNode) {
        return
      }

      connection.send({
        type: 'AddNode',
        path,
        currentUri,
        nodeUri
      })

      commit('addElement', {
        path,
        node: newNode
      })

      const localName = getters.localNameOfDragging
      if (!localName) {
        commit('addChildComponent', {
          name: newNode.name,
          uri: state.draggingUri!
        })
      }
    },

    startDragging({ commit }, uri) {
      commit('setDraggingUri', uri)
    },

    endDragging({ commit }) {
      commit('setDraggingUri', undefined)
      commit('setDraggingPath', [])
    },

    setDraggingPlace({ state, getters, commit }, { path, place }) {
      clearTimeout(draggingTimer)
      draggingTimer = setTimeout(() => {
        const doc = getters.currentDocument
        if (!doc || !doc.template) {
          return
        }

        const node = getNode(doc.template, path)
        if (!node) {
          return
        }

        let insertInto: number[]
        if (place === 'before') {
          insertInto = node.path
        } else if (place === 'after') {
          const last = node.path[node.path.length - 1]
          insertInto = node.path.slice(0, -1).concat(last + 1)
        } else if (place === 'first') {
          const el = node as Element
          assert(
            el.type === 'Element',
            `[store/project] node type must be 'Element' when place is 'first' but received '${
              node.type
            }'`
          )
          insertInto = el.path.concat(0)
        } else {
          const el = node as Element
          assert(
            el.type === 'Element',
            `[store/project] node type must be 'Element' when place is 'last' but received '${
              node.type
            }'`
          )
          const len = el.children.length
          insertInto = el.path.concat(len)
        }

        const isUpdated =
          state.draggingPath.length !== insertInto.length ||
          path.reduce((acc, el, i) => {
            return acc || state.draggingPath[i] !== el
          }, false)

        if (isUpdated) {
          commit('setDraggingPath', insertInto)
        }
      }, draggingInterval)
    },

    updateDeclaration({ state, commit }, payload) {
      if (!state.currentUri) return

      const updater: DeclarationUpdater = {
        path: payload.path
      }

      if (payload.prop) {
        updater.prop = payload.prop
      }

      if (payload.value) {
        const match = /^\s*(.*)\s+!important\s*$/.exec(payload.value)
        if (match) {
          updater.value = match[1]
          updater.important = true
        } else {
          updater.value = payload.value
          updater.important = false
        }
      }

      connection.send({
        type: 'UpdateDeclaration',
        uri: state.currentUri,
        declaration: updater
      })

      commit('updateMachedRuleDeclaration', updater)
    }
  },

  mutations: {
    setDocuments(state, vueFiles) {
      state.documents = vueFiles
    },

    changeDocument(state, uri) {
      if (state.currentUri !== uri) {
        state.currentUri = uri
        state.selectedPath = []
        state.matchedRules = []
      }
    },

    select(state, path) {
      state.selectedPath = path
      state.matchedRules = []
    },

    addElement(state, { path, node }) {
      const uri = state.currentUri
      if (uri) {
        const doc = state.documents[uri]
        if (doc && doc.template) {
          doc.template = insertNode(doc.template, path, node)
        }
      }
    },

    addChildComponent(state, childComponent) {
      const uri = state.currentUri
      if (uri) {
        const doc = state.documents[uri]
        if (doc) {
          doc.childComponents = doc.childComponents.concat(childComponent)
        }
      }
    },

    setDraggingUri(state, uri) {
      state.draggingUri = uri
    },

    setDraggingPath(state, path) {
      state.draggingPath = path
    },

    setMatchedRules(state, rules) {
      state.matchedRules = rules
    },

    // TODO: we should find better approach to update client declaration
    updateMachedRuleDeclaration(state, declaration) {
      const path = declaration.path
      const parentPath = path.slice(0, -1)
      const index = path[path.length - 1]

      const targetRule = state.matchedRules.find(rule => {
        if (parentPath.length !== rule.path.length) {
          return false
        }
        return rule.path.reduce((acc, p, i) => acc && p === parentPath[i], true)
      })

      if (targetRule) {
        const original = targetRule.declarations[index]
        Vue.set(targetRule.declarations, index, clone(original, declaration))
      }
    }
  }
}
