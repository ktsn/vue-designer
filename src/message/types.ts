import { RuleForPrint } from '../parser/style/types'
import { VueFilePayload } from '../parser/vue-file'

export interface Events {
  initClient: undefined
  selectNode: {
    uri: string
    path: number[]
  }
  addNode: {
    currentUri: string
    nodeUri: string
    path: number[]
  }
  changeActiveEditor: string
  updateEditor: {
    uri: string
    code: string
  }
  addDocument: {
    uri: string
    code: string
  }
  changeDocument: {
    uri: string
    code: string
  }
  removeDocument: string
}

export interface Commands {
  initProject: Record<string, VueFilePayload>
  changeDocument: string
  matchRules: RuleForPrint[]
  highlightEditor: {
    uri: string
    ranges: [number, number][]
  }
  updateEditor: {
    uri: string
    code: string
  }
}
