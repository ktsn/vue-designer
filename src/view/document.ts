import { Template } from '../parser/template'
import { Prop } from '../parser/script'

export interface DocumentProvider {
  onInitDocument(
    fn: (template: Template | null, props: Prop[], styles: string[]) => void
  ): void
}

export class Document {
  private listeners: ((
    template: Template | null,
    props: Prop[],
    styles: string[]
  ) => void)[] = []

  constructor(private provider: DocumentProvider) {
    provider.onInitDocument((template, props, styles) => {
      this.listeners.forEach(listener => {
        listener(template, props, styles)
      })
    })
  }

  subscribe(
    listener: (
      template: Template | null,
      props: Prop[],
      styles: string[]
    ) => void
  ): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners.splice(this.listeners.indexOf(listener), 1)
    }
  }
}
