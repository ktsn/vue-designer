import { VueFilePayload } from '../parser/vue-file'

export interface SubjectType {
  initProject: {
    vueFiles: Record<string, VueFilePayload>
  }
  initSharedStyle: {
    style: string
  }
  changeDocument: {
    uri: string
  }
}
