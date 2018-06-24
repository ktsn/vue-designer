import assert from 'assert'
import Vue from 'vue'
import { Getters, Mutations, Actions, module } from 'sinai'
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

let connection: ClientConnection
let styleMatcher: StyleMatcher
let draggingTimer: any
const draggingInterval = 80

export class ProjectState {
  documents: Record<string, VueFilePayload> = {}
  documentScopes: Record<string, DocumentScope> = {}
  currentUri: string | undefined = undefined
  draggingUri: string | undefined = undefined
  selectedPath: number[] = []
  draggingPath: number[] = []
  matchedRules: RuleForPrint[] = []
}

export class ProjectGetters extends Getters<ProjectState>() {
  get scopedDocuments(): Record<string, ScopedDocument> {
    const { state } = this
    return mapValues(state.documents, doc => {
      const pathEls = doc.uri.split('/')
      const displayName = pathEls[pathEls.length - 1].replace(/\..*$/, '')

      return {
        uri: doc.uri,
        displayName,
        template: doc.template && addScopeToTemplate(doc.template, doc.scopeId),
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
  }

  get currentDocument(): VueFilePayload | undefined {
    const { state } = this
    if (!state.currentUri) {
      return undefined
    }
    return state.documents[state.currentUri]
  }

  get currentScope(): DocumentScope | undefined {
    const { state } = this
    if (!state.currentUri) {
      return undefined
    }
    return state.documentScopes[state.currentUri]
  }

  get currentRenderingDocument(): ScopedDocument | undefined {
    const { state } = this
    if (!state.currentUri) {
      return undefined
    }

    const doc = this.scopedDocuments[state.currentUri]
    if (!doc) {
      return undefined
    }

    const dragging = this.draggingScopedDocument
    const insertInto = state.draggingPath
    const newNode = this.nodeOfDragging
    if (!doc.template || !dragging || insertInto.length === 0 || !newNode) {
      return doc
    }

    const newChildComponents = this.localNameOfDragging
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
  }

  get draggingScopedDocument(): ScopedDocument | undefined {
    const { state } = this
    return state.draggingUri
      ? this.scopedDocuments[state.draggingUri]
      : undefined
  }

  get localNameOfDragging(): string | undefined {
    const { state } = this
    const doc = state.currentUri && this.scopedDocuments[state.currentUri]
    const dragging = this.draggingScopedDocument

    if (!doc || !dragging) {
      return undefined
    }

    return doc.childComponents.reduce<string | undefined>((acc, comp) => {
      if (acc) return acc

      if (comp.uri === dragging.uri) {
        return comp.name
      }
    }, undefined)
  }

  get nodeOfDragging(): Element | undefined {
    const dragging = this.draggingScopedDocument
    if (!dragging) {
      return
    }

    const localName = this.localNameOfDragging
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
}

export class ProjectMutations extends Mutations<ProjectState>() {
  setDocuments(vueFiles: Record<string, VueFilePayload>): void {
    this.state.documents = vueFiles
  }

  changeDocument(uri: string): void {
    const { state } = this
    if (state.currentUri !== uri) {
      state.currentUri = uri
      state.selectedPath = []
      state.matchedRules = []
    }
  }

  select(path: number[]): void {
    const { state } = this
    state.selectedPath = path
    state.matchedRules = []
  }

  addElement({ path, node }: { path: number[]; node: Element }): void {
    const { state } = this
    const uri = state.currentUri
    if (uri) {
      const doc = state.documents[uri]
      if (doc && doc.template) {
        doc.template = insertNode(doc.template, path, node)
      }
    }
  }

  addChildComponent(childComponent: ChildComponent): void {
    const { state } = this
    const uri = state.currentUri
    if (uri) {
      const doc = state.documents[uri]
      if (doc) {
        doc.childComponents = doc.childComponents.concat(childComponent)
      }
    }
  }

  setDraggingUri(uri: string | undefined): void {
    this.state.draggingUri = uri
  }

  setDraggingPath(path: number[]): void {
    this.state.draggingPath = path
  }

  setMatchedRules(rules: RuleForPrint[]): void {
    this.state.matchedRules = rules
  }

  // TODO: move this logic to server side
  refreshScope({
    uri,
    props,
    data
  }: {
    uri: string
    props: Prop[]
    data: Data[]
  }) {
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

    let scope = this.state.documentScopes[uri]
    if (!scope) {
      scope = Vue.set(this.state.documentScopes, uri, {
        props: {},
        data: {}
      })
    }

    update(scope.props, props)
    update(scope.data, data)
  }

  updatePropValue({ name, value }: { name: string; value: any }): void {
    const uri = this.state.currentUri
    if (!uri) return

    const scope = this.state.documentScopes[uri]
    if (!scope) return

    const target = scope.props[name]
    if (!target) return

    target.value = value
  }

  updateDataValue({ name, value }: { name: string; value: any }): void {
    const uri = this.state.currentUri
    if (!uri) return

    const scope = this.state.documentScopes[uri]
    if (!scope) return

    const target = scope.data[name]
    if (!target) return

    target.value = value
  }
}

export class ProjectActions extends Actions<
  ProjectState,
  ProjectGetters,
  ProjectMutations
>() {
  init(payload: {
    connection: ClientConnection
    styleMatcher: StyleMatcher
  }): void {
    connection = payload.connection
    styleMatcher = payload.styleMatcher

    connection.onMessage(data => {
      switch (data.type) {
        case 'InitProject':
          this.mutations.setDocuments(data.vueFiles)
          styleMatcher.clear()
          Object.keys(data.vueFiles).forEach(key => {
            const file = data.vueFiles[key]
            styleMatcher.register(file.uri, file.styles)

            this.mutations.refreshScope({
              uri: key,
              props: file.props,
              data: file.data
            })
          })
          this.matchSelectedNodeWithStyles()
          break
        case 'ChangeDocument':
          this.mutations.changeDocument(data.uri)
          break
        default: // Do nothing
      }
    })
  }

  select(node: Element | undefined): void {
    const { state, getters, mutations } = this
    const current = getters.currentDocument
    if (!current) return

    const path = node ? node.path : []

    mutations.select(path)
    this.matchSelectedNodeWithStyles()

    connection.send({
      type: 'SelectNode',
      uri: current.uri,
      templatePath: path,
      stylePaths: state.matchedRules.map(r => r.path)
    })
  }

  applyDraggingElement(): void {
    const { state, getters, mutations } = this
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

    mutations.addElement({
      path,
      node: newNode
    })

    const localName = getters.localNameOfDragging
    if (!localName) {
      mutations.addChildComponent({
        name: newNode.name,
        uri: state.draggingUri!
      })
    }
  }

  startDragging(uri: string): void {
    this.mutations.setDraggingUri(uri)
  }

  endDragging(): void {
    const { setDraggingUri, setDraggingPath } = this.mutations
    setDraggingUri(undefined)
    setDraggingPath([])
  }

  setDraggingPlace({
    path,
    place
  }: {
    path: number[]
    place: DraggingPlace
  }): void {
    clearTimeout(draggingTimer)
    draggingTimer = setTimeout(() => {
      const doc = this.getters.currentDocument
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
        this.state.draggingPath.length !== insertInto.length ||
        path.reduce((acc, el, i) => {
          return acc || this.state.draggingPath[i] !== el
        }, false)

      if (isUpdated) {
        this.mutations.setDraggingPath(insertInto)
      }
    }, draggingInterval)
  }

  addDeclaration({ path }: { path: number[] }): void {
    if (!this.state.currentUri) return

    connection.send({
      type: 'AddDeclaration',
      uri: this.state.currentUri,
      path,
      declaration: {
        // Currently, write the placeholder value to simplify the implementation.
        prop: 'property',
        value: 'value',
        important: false
      }
    })
  }

  removeDeclaration({ path }: { path: number[] }): void {
    if (!this.state.currentUri) return

    connection.send({
      type: 'RemoveDeclaration',
      uri: this.state.currentUri,
      path
    })
  }

  updateDeclaration(payload: {
    path: number[]
    prop: string
    value: string
  }): void {
    if (!this.state.currentUri) return

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
      uri: this.state.currentUri,
      declaration: updater
    })
  }

  matchSelectedNodeWithStyles(): void {
    const doc = this.getters.currentDocument
    const selected = this.state.selectedPath

    if (!doc || !doc.template || selected.length === 0) {
      this.mutations.setMatchedRules([])
      return
    }

    const matchedRules = styleMatcher.match(doc.uri, doc.template, selected)
    const forPrint = matchedRules.map(transformRuleForPrint)

    this.mutations.setMatchedRules(forPrint)
  }
}

export const project = module({
  state: ProjectState,
  getters: ProjectGetters,
  mutations: ProjectMutations,
  actions: ProjectActions
})
