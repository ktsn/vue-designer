import { VueFilePayload } from './parser/vue-file'

export interface SubjectTypes {
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
