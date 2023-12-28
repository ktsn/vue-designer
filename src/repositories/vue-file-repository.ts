import assert from 'assert'
import { EventEmitter } from 'events'
import { VueFile, resolveImportPath, parseVueFile } from '../parser/vue-file'
import { Modifiers, modify } from '../parser/modifier'
import { insertToTemplate } from '../parser/template/modify'
import { insertComponentScript } from '../parser/script/modify'
import {
  STDeclarationForAdd,
  STDeclarationForUpdate,
} from '../parser/style/types'
import {
  insertDeclaration,
  removeDeclaration,
  updateDeclaration,
} from '../parser/style/modify'

export interface VueFileRepositoryFs {
  /**
   * Read a file content as string.
   */
  readFile(uri: string): Promise<string>

  /**
   * Modify a file with specified modifiers.
   */
  modifyFile(uri: string, modifiers: Modifiers): Promise<void>
}

export class VueFileRepository extends EventEmitter {
  // Vue file uri -> VueFile
  private files: Map<string, VueFile>

  constructor(private fs: VueFileRepositoryFs) {
    super()
    this.files = new Map()
  }

  static async create(
    initialFiles: string[],
    fs: VueFileRepositoryFs,
  ): Promise<VueFileRepository> {
    const repo = new VueFileRepository(fs)
    initialFiles.forEach((uri) => repo.read(uri))
    return repo
  }

  get(uri: string): VueFile | undefined {
    return this.files.get(uri)
  }

  async read(uri: string): Promise<VueFile> {
    const code = await this.fs.readFile(uri)
    this.set(uri, code)
    return this.get(uri)!
  }

  delete(uri: string): void {
    this.files.delete(uri)
  }

  map<R>(fn: (file: VueFile, uri: string) => R): Record<string, R> {
    const res: Record<string, R> = {}
    this.files.forEach((file, uri) => {
      res[uri] = fn(file, uri)
    })
    return res
  }

  addTemplateNode(uri: string, insertNodeUri: string, path: number[]): void {
    const target = this.get(uri)
    if (!target || !target.template) return

    const component = this.get(insertNodeUri)
    if (!component) return

    const existingComponent = target.childComponents.find((child) => {
      return child.uri === component.uri.toString()
    })

    const componentName = existingComponent
      ? existingComponent.name
      : component.name

    const modifiers: Modifiers = [
      insertToTemplate(
        target.template,
        path,
        `<${componentName}></${componentName}>`,
      ),
    ]

    if (!existingComponent) {
      modifiers.push(
        insertComponentScript(
          target.script,
          target.code,
          componentName,
          resolveImportPath(target, component),
        ),
      )
    }

    this.modify(uri, target.code, modifiers)
  }

  addStyleDeclaration(
    uri: string,
    declaration: STDeclarationForAdd,
    path: number[],
  ): void {
    const file = this.get(uri)
    if (!file) {
      return
    }

    const { code, styles } = file
    this.modify(uri, code, [insertDeclaration(styles, declaration, path)])
  }

  removeStyleDeclaration(uri: string, path: number[]): void {
    const file = this.get(uri)
    if (!file) {
      return
    }

    const { code, styles } = file
    this.modify(uri, code, [removeDeclaration(styles, path)])
  }

  updateStyleDeclaration(
    uri: string,
    declaration: STDeclarationForUpdate,
  ): void {
    const file = this.get(uri)
    if (!file) {
      return
    }

    const { code, styles } = file
    this.modify(uri, code, [updateDeclaration(styles, declaration)])
  }

  on(event: 'update', fn: (vueFile: VueFile) => void): this {
    return super.on(event, fn)
  }

  destroy(): void {
    this.removeAllListeners()
  }

  private set(uri: string, code: string): void {
    this.files.set(uri, parseVueFile(code, uri))
  }

  private modify(uri: string, prevCode: string, modifiers: Modifiers): void {
    this.set(uri, modify(prevCode, modifiers))

    const vueFile = this.get(uri)!
    assert(vueFile, `VueFile object '${uri}' not found after saving it`)
    this.emit('update', vueFile)

    // We don't wait until the file is saved
    this.fs.modifyFile(uri, modifiers)
  }
}
