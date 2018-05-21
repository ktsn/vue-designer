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
import { RuleForPrint, DeclarationForUpdate } from '@/parser/style/types'
import { addScope as addScopeToStyle } from '@/parser/style/manipulate'
import { genStyle } from '@/parser/style/codegen'
import { Prop, Data, ChildComponent } from '@/parser/script/types'
import { ClientConnection } from '@/view/communication'
import { mapValues } from '@/utils'
import { StyleMatcher } from '@/view/store/style-matcher'
import { transformRuleForPrint } from '@/parser/style/transform'

export interface ScopedDocument {
  uri: string
  displayName: string
  template: Template | undefined
  props: Prop[]
  data: Data[]
  childComponents: ChildComponent[]
  styleCode: string
}

interface DocumentScopeItem {
  type: string | null
  value: any
}

export interface DocumentScope {
  props: Record<string, DocumentScopeItem>
  data: Record<string, DocumentScopeItem>
}

export type DraggingPlace = 'before' | 'after' | 'first' | 'last'

export interface ProjectState {
  documents: Record<string, VueFilePayload>
  documentScopes: Record<string, DocumentScope>
  currentUri: string | undefined
  draggingUri: string | undefined
  selectedPath: number[]
  draggingPath: number[]
  matchedRules: RuleForPrint[]
}

interface ProjectGetters {
  scopedDocuments: Record<string, ScopedDocument>
  currentDocument: VueFilePayload | undefined
  currentScope: DocumentScope | undefined
  currentRenderingDocument: ScopedDocument | undefined
  draggingScopedDocument: ScopedDocument | undefined
  localNameOfDragging: string | undefined
  nodeOfDragging: Element | undefined
}

interface ProjectActions {
  init: {
    connection: ClientConnection
    styleMatcher: StyleMatcher
  }
  select: Element | undefined
  applyDraggingElement: undefined
  startDragging: string
  endDragging: undefined
  setDraggingPlace: { path: number[]; place: DraggingPlace }
  addDeclaration: {
    path: number[]
  }
  removeDeclaration: {
    path: number[]
  }
  updateDeclaration: {
    path: number[]
    prop?: string
    value?: string
  }
  matchSelectedNodeWithStyles: undefined
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

  // TODO: add removeScope mutation after splitting
  // document update notification into more grained
  refreshScope: {
    uri: string
    props: Prop[]
    data: Data[]
  }
  updatePropValue: {
    name: string
    value: any
  }
  updateDataValue: {
    name: string
    value: any
  }
}

export const projectHelpers = createNamespacedHelpers<
  ProjectState,
  ProjectGetters,
  ProjectMutations,
  ProjectActions
>('project')

let connection: ClientConnection
let styleMatcher: StyleMatcher
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
    documentScopes: {},
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

    currentScope(state) {
      if (!state.currentUri) {
        return undefined
      }
      return state.documentScopes[state.currentUri]
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
    init({ commit, dispatch }, payload) {
      connection = payload.connection
      styleMatcher = payload.styleMatcher

      connection.onMessage(data => {
        switch (data.type) {
          case 'InitProject':
            commit('setDocuments', data.vueFiles)
            styleMatcher.clear()
            Object.keys(data.vueFiles).forEach(key => {
              const file = data.vueFiles[key]
              styleMatcher.register(file.uri, file.styles)

              commit('refreshScope', {
                uri: key,
                props: file.props,
                data: file.data
              })
            })
            dispatch('matchSelectedNodeWithStyles', undefined)
            break
          case 'ChangeDocument':
            commit('changeDocument', data.uri)
            break
          default: // Do nothing
        }
      })
    },

    select({ commit, dispatch, getters, state }, node) {
      const current = getters.currentDocument
      if (!current) return

      const path = node ? node.path : []

      commit('select', path)
      dispatch('matchSelectedNodeWithStyles', undefined).then(() => {
        connection.send({
          type: 'SelectNode',
          uri: current.uri,
          templatePath: path,
          stylePaths: state.matchedRules.map(r => r.path)
        })
      })
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

    addDeclaration({ state }, { path }) {
      if (!state.currentUri) return

      connection.send({
        type: 'AddDeclaration',
        uri: state.currentUri,
        path,
        declaration: {
          // Currently, write the placeholder value to simplify the implementation.
          prop: 'property',
          value: 'value',
          important: false
        }
      })
    },

    removeDeclaration({ state }, { path }) {
      if (!state.currentUri) return

      connection.send({
        type: 'RemoveDeclaration',
        uri: state.currentUri,
        path
      })
    },

    updateDeclaration({ state }, payload) {
      if (!state.currentUri) return

      const updater: DeclarationForUpdate = {
        path: payload.path
      }

      // This check does not pass if prop (and value) is an empty string.
      // It is intentional since the css parser will go unexpected state
      // if we update them to empty value.
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
    },

    matchSelectedNodeWithStyles({ commit, getters, state }) {
      const doc = getters.currentDocument
      const selected = state.selectedPath

      if (!doc || !doc.template || selected.length === 0) {
        commit('setMatchedRules', [])
        return
      }

      const matchedRules = styleMatcher.match(doc.uri, doc.template, selected)
      const forPrint = matchedRules.map(transformRuleForPrint)

      commit('setMatchedRules', forPrint)
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

    // TODO: move this logic to server side
    refreshScope(state, { uri, props, data }) {
      function update(
        scope: Record<string, DocumentScopeItem>,
        next: (Prop | Data)[]
      ): void {
        const willRemove = Object.keys(scope)

        next.forEach(item => {
          if (!scope[item.name]) {
            Vue.set(scope, item.name, {
              type: null,
              value: item.default
            })
          }

          scope[item.name].type = 'type' in item ? item.type : null

          const index = willRemove.indexOf(item.name)
          if (index >= 0) {
            willRemove.splice(index, 1)
          }
        })

        willRemove.forEach(key => {
          Vue.delete(scope, key)
        })
      }

      let scope = state.documentScopes[uri]
      if (!scope) {
        scope = Vue.set(state.documentScopes, uri, {
          props: {},
          data: {}
        })
      }

      update(scope.props, props)
      update(scope.data, data)
    },

    updatePropValue(state, { name, value }) {
      const uri = state.currentUri
      if (!uri) return

      const scope = state.documentScopes[uri]
      if (!scope) return

      const target = scope.props[name]
      if (!target) return

      target.value = value
    },

    updateDataValue(state, { name, value }) {
      const uri = state.currentUri
      if (!uri) return

      const scope = state.documentScopes[uri]
      if (!scope) return

      const target = scope.data[name]
      if (!target) return

      target.value = value
    }
  }
}
