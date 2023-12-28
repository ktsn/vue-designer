import { Mutations } from 'sinai'
import { VueFilePayload } from '../../../../parser/vue-file'
import { TEElement } from '../../../../parser/template/types'
import { insertNode } from '../../../../parser/template/manipulate'
import { STRuleForPrint } from '../../../../parser/style/types'
import { Prop, Data, ChildComponent } from '../../../../parser/script/types'
import { ProjectState } from './project-state'
import { DocumentScopeItem } from './types'

export class ProjectMutations extends Mutations<ProjectState>() {
  setDocuments(vueFiles: Record<string, VueFilePayload>): void {
    this.state.documents = vueFiles
  }

  setDocument(vueFile: VueFilePayload): void {
    this.state.documents[vueFile.uri] = vueFile
  }

  removeDocument(uri: string): void {
    delete this.state.documents[uri]
  }

  changeActiveDocument(uri: string): void {
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

  addElement({ path, node }: { path: number[]; node: TEElement }): void {
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

  setSharedStyle(style: string): void {
    this.state.sharedStyle = style
  }

  setDraggingUri(uri: string | undefined): void {
    this.state.draggingUri = uri
  }

  setDraggingPath(path: number[]): void {
    this.state.draggingPath = path
  }

  setMatchedRules(rules: STRuleForPrint[]): void {
    this.state.matchedRules = rules
  }

  // TODO: move this logic to server side
  refreshScope({
    uri,
    props,
    data,
  }: {
    uri: string
    props: Prop[]
    data: Data[]
  }) {
    function update(
      scope: Record<string, DocumentScopeItem>,
      next: (Prop | Data)[],
    ): void {
      const willRemove = Object.keys(scope)

      next.forEach((item) => {
        if (!scope[item.name]) {
          scope[item.name] = {
            type: null,
            value: item.default,
          }
        }

        scope[item.name].type = 'type' in item ? item.type : null

        const index = willRemove.indexOf(item.name)
        if (index >= 0) {
          willRemove.splice(index, 1)
        }
      })

      willRemove.forEach((key) => {
        delete scope[key]
      })
    }

    let scope = this.state.documentScopes[uri]
    if (!scope) {
      scope = this.state.documentScopes[uri] = {
        props: {},
        data: {},
      }
    }

    update(scope.props, props)
    update(scope.data, data)
  }

  cleanScope(uri: string): void {
    delete this.state.documentScopes[uri]
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
