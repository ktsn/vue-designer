export interface DocumentProvider {
  onInitDocument(fn: (template: string, style: string) => void): void
}

export class Document {
  private listeners: ((document: any) => void)[] = []

  constructor(private provider: DocumentProvider) {
    provider.onInitDocument((template, style) => {
      this.listeners.forEach(listener => {
        listener({ template, style })
      })
    })
  }

  subscribe(listener: (document: any) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners.splice(this.listeners.indexOf(listener), 1)
    }
  }
}
