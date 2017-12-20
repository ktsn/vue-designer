import { Template } from "../payload";

export interface DocumentProvider {
  onInitDocument(fn: (template: Template | null, styles: string[]) => void): void
}

export class Document {
  private listeners: ((template: Template | null, styles: string[]) => void)[] = []

  constructor(private provider: DocumentProvider) {
    provider.onInitDocument((template, styles) => {
      this.listeners.forEach(listener => {
        listener(template, styles)
      })
    })
  }

  subscribe(
    listener: (template: Template | null, styles: string[]) => void
  ): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners.splice(this.listeners.indexOf(listener), 1)
    }
  }
}
