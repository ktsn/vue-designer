import { EventEmitter } from 'events'
import { VueFile, resolveImportPath, parseVueFile } from '../parser/vue-file'
import { Modifiers, modify } from '../parser/modifier'
import { insertToTemplate } from '../parser/template/modify'
import { insertComponentScript } from '../parser/script/modify'
import {
  STDeclarationForAdd,
  STDeclarationForUpdate
} from '../parser/style/types'
import {
  insertDeclaration,
  removeDeclaration,
  updateDeclaration
} from '../parser/style/modify'

export interface VueFileRepositoryFs {
  readFile(uri: string): Promise<string>
  writeFile(uri: string, code: string): Promise<void>
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
    fs: VueFileRepositoryFs
  ): Promise<VueFileRepository> {
    const repo = new VueFileRepository(fs)
    initialFiles.forEach(uri => repo.read(uri))
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

    const existingComponent = target.childComponents.find(child => {
      return child.uri === component.uri.toString()
    })

    const componentName = existingComponent
      ? existingComponent.name
      : component.name

    const modifier: Modifiers = [
      insertToTemplate(
        target.template,
        path,
        `<${componentName}></${componentName}>`
      )
    ]

    if (!existingComponent) {
      modifier.push(
        insertComponentScript(
          target.script,
          target.code,
          componentName,
          resolveImportPath(target, component)
        )
      )
    }

    const updated = modify(target.code, modifier)
    this.save(uri, updated)
  }

  addStyleDeclaration(
    uri: string,
    declaration: STDeclarationForAdd,
    path: number[]
  ): void {
    const file = this.get(uri)
    if (!file) {
      return
    }

    const { code, styles } = file
    const added = modify(code, [insertDeclaration(styles, declaration, path)])

    this.save(uri, added)
  }

  removeStyleDeclaration(uri: string, path: number[]): void {
    const file = this.get(uri)
    if (!file) {
      return
    }

    const { code, styles } = file
    const removed = modify(code, [removeDeclaration(styles, path)])

    this.save(uri, removed)
  }

  updateStyleDeclaration(
    uri: string,
    declaration: STDeclarationForUpdate
  ): void {
    const file = this.get(uri)
    if (!file) {
      return
    }

    const { code, styles } = file
    const updated = modify(code, [updateDeclaration(styles, declaration)])

    this.save(uri, updated)
  }

  on(event: 'update', fn: () => void): this {
    return super.on(event, fn)
  }

  destroy(): void {
    this.removeAllListeners()
  }

  private set(uri: string, code: string): void {
    this.files.set(uri, parseVueFile(code, uri))
  }

  private save(uri: string, code: string): void {
    this.set(uri, code)
    this.emit('update')
    // We don't wait until the file is saved
    this.fs.writeFile(uri, code)
  }
}
