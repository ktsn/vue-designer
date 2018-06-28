import assert from 'assert'
import { Actions } from 'sinai'
import { Element } from '@/parser/template/types'
import { getNode } from '@/parser/template/manipulate'
import { DeclarationForUpdate } from '@/parser/style/types'
import { ClientConnection } from '@/view/communication'
import { StyleMatcher } from '@/view/store/style-matcher'
import { transformRuleForPrint } from '@/parser/style/transform'
import { ProjectState } from './project-state'
import { ProjectGetters } from './project-getters'
import { ProjectMutations } from './project-mutations'
import { DraggingPlace } from './types'

let connection: ClientConnection
let styleMatcher: StyleMatcher
let draggingTimer: any
const draggingInterval = 80

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
        case 'InitSharedStyle':
          this.mutations.setSharedStyle(data.style)
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
