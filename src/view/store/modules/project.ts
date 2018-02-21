import { DefineModule, createNamespacedHelpers } from 'vuex'
import { VueFilePayload } from '@/parser/vue-file'
import {
  Template,
  Element,
  addScope as addScopeToTemplate,
  insertNode
} from '@/parser/template'
import { ClientConnection } from '@/view/communication'
import { mapValues } from '@/utils'
import { addScope as addScopeToStyle } from '@/parser/style'
import { genStyle } from '@/parser/style-codegen'
import { Prop, Data, ChildComponent } from '@/parser/script'

export interface ScopedDocument {
  uri: string
  displayName: string
  template: Template | undefined
  props: Prop[]
  data: Data[]
  childComponents: ChildComponent[]
  styleCode: string
}

export interface ProjectState {
  documents: Record<string, VueFilePayload>
  currentUri: string | undefined
  draggingUri: string | undefined
  selectedPath: number[]
  draggingPath: number[]
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
  select: Element
  applyDraggingElement: undefined
  startDragging: string
  endDragging: undefined
  setDraggingPath: number[]
}

interface ProjectMutations {
  setDocuments: Record<string, VueFilePayload>
  changeDocument: string
  select: Element
  addElement: { path: number[]; node: Element }
  addChildComponent: ChildComponent
  setDraggingUri: string | undefined
  setDraggingPath: number[]
}

export const projectHelpers = createNamespacedHelpers<
  ProjectState,
  ProjectGetters,
  ProjectMutations,
  ProjectActions
>('project')

let connection: ClientConnection
let draggingTimer: any
const draggingInterval = 200

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
    draggingPath: []
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
        attributes: [],
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
          default: // Do nothing
        }
      })
    },

    select({ commit, getters }, node) {
      const current = getters.currentDocument
      if (!current) return

      connection.send({
        type: 'SelectNode',
        uri: current.uri,
        path: node.path
      })
      commit('select', node)
    },

    applyDraggingElement({ commit, state, getters }) {
      const path = state.draggingPath
      const newNode = getters.nodeOfDragging

      if (path.length === 0 || !newNode) {
        return
      }

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

    setDraggingPath({ state, commit }, path) {
      // The dragging node has zero-length path
      if (path.length === 0) {
        return
      }

      clearTimeout(draggingTimer)
      draggingTimer = setTimeout(() => {
        const isUpdated =
          state.draggingPath.length !== path.length ||
          path.reduce((acc, el, i) => {
            return acc || state.draggingPath[i] !== el
          }, false)

        if (isUpdated) {
          commit('setDraggingPath', path)
        }
      }, draggingInterval)
    }
  },

  mutations: {
    setDocuments(state, vueFiles) {
      state.documents = vueFiles
    },

    changeDocument(state, uri) {
      state.currentUri = uri
      state.selectedPath = []
    },

    select(state, node) {
      state.selectedPath = node.path
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
    }
  }
}
