import { Getters } from 'sinai'
import { ProjectState } from './project-state'
import { ScopedDocument, DocumentScope } from './types'
import {
  addScope as addScopeToTemplate,
  insertNode
} from '@/parser/template/manipulate'
import { addScope as addScopeToStyle } from '@/parser/style/manipulate'
import { genStyle } from '@/parser/style/codegen'
import { VueFilePayload } from '@/parser/vue-file'
import { TEElement } from '@/parser/template/types'
import { mapValues } from '@/utils'

export class ProjectGetters extends Getters<ProjectState>() {
  get scopedDocuments(): Record<string, ScopedDocument> {
    const { state } = this
    return mapValues(state.documents, doc => {
      const pathEls = doc.uri.split('/')
      const displayName = pathEls[pathEls.length - 1].replace(/\..*$/, '')

      const styleCodes = doc.styles.reduce<string[]>((acc, style) => {
        return acc.concat(genStyle(addScopeToStyle(style, doc.scopeId)))
      }, [])

      return {
        uri: doc.uri,
        displayName,
        template: doc.template && addScopeToTemplate(doc.template, doc.scopeId),
        props: doc.props,
        data: doc.data,
        childComponents: doc.childComponents,
        styleCode: styleCodes.join('\n')
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

  get currentDocumentName(): string | undefined {
    return this.currentRenderingDocument
      ? this.currentRenderingDocument.displayName
      : undefined
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

  get nodeOfDragging(): TEElement | undefined {
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
        attrs: {},
        props: {},
        domProps: {},
        directives: [],
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
