import { VueFile } from '../parser/vue-file'

export interface DocumentProvider {
  onInitDocument(fn: (vueFile: VueFile) => void): void
}

export class Document {
  private listeners: ((vueFile: VueFile) => void)[] = []

  constructor(provider: DocumentProvider) {
    provider.onInitDocument(vueFile => {
      this.listeners.forEach(listener => {
        listener(vueFile)
      })
    })
  }

  subscribe(listener: (vueFile: VueFile) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners.splice(this.listeners.indexOf(listener), 1)
    }
  }
}
