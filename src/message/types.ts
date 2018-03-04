import { RuleForPrint } from '../parser/style/types'
import { VueFilePayload } from '../parser/vue-file'

export interface Events {
  selectNode: {
    uri: string
    path: number[]
  }
  addNode: {
    currentUri: string
    nodeUri: string
    path: number[]
  }
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
