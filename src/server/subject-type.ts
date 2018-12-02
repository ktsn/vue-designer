import { VueFilePayload } from '../parser/vue-file'

export interface SubjectType {
  initProject: {
    vueFiles: Record<string, VueFilePayload>
  }
  initSharedStyle: {
    style: string
  }
  changeActiveDocument: {
    uri: string
  }
  saveDocument: {
    vueFile: VueFilePayload
  }
  removeDocument: {
    uri: string
  }
}
