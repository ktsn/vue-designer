import { VueFilePayload } from '@/parser/vue-file'
import { RuleForPrint } from '@/parser/style/types'
import { DocumentScope } from './types'

export class ProjectState {
  documents: Record<string, VueFilePayload> = {}
  documentScopes: Record<string, DocumentScope> = {}
  currentUri: string | undefined = undefined
  draggingUri: string | undefined = undefined
  selectedPath: number[] = []
  draggingPath: number[] = []
  matchedRules: RuleForPrint[] = []
}
