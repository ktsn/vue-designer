import { VueFilePayload } from '@/parser/vue-file'
import { STRuleForPrint } from '@/parser/style/types'
import { DocumentScope } from './types'

export class ProjectState {
  documents: Record<string, VueFilePayload> = {}
  documentScopes: Record<string, DocumentScope> = {}
  sharedStyle = ''
  currentUri: string | undefined = undefined
  draggingUri: string | undefined = undefined
  selectedPath: number[] = []
  draggingPath: number[] = []
  matchedRules: STRuleForPrint[] = []
}
