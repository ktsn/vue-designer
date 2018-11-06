import { VueFile } from '../parser/vue-file'
import { getNode as getTemplateNode } from '../parser/template/manipulate'
import { getNode as getStyleNode } from '../parser/style/manipulate'

interface VueFileRepository {
  get(uri: string): VueFile | undefined
}

interface Highlight {
  dispose(): void
}

export interface EditorRepositoryOperations {
  highlight(uri: string, ranges: Array<[number, number]>): Highlight | undefined
}

export class EditorRepository {
  private currentHighlight: Highlight | undefined

  constructor(
    public activeDocumentUrl: string | undefined,
    private vueFiles: VueFileRepository,
    private operations: EditorRepositoryOperations
  ) {}

  selectNode(
    uri: string,
    templatePath: number[],
    stylePaths: number[][]
  ): void {
    if (this.currentHighlight) {
      this.currentHighlight.dispose()
      this.currentHighlight = undefined
    }

    const vueFile = this.vueFiles.get(uri)
    if (!vueFile || !vueFile.template || templatePath.length === 0) {
      return
    }

    const element = getTemplateNode(vueFile.template, templatePath)
    if (!element) {
      return
    }

    function notUndef<T>(n: T | undefined): n is T {
      return n !== undefined
    }

    const styleRules = stylePaths
      .map(path => getStyleNode(vueFile.styles, path))
      .filter(notUndef)

    const highlightRanges = [element, ...styleRules].map(node => {
      return node.range
    })

    this.currentHighlight = this.operations.highlight(uri, highlightRanges)
  }
}
