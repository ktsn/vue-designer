import { MessageBus } from 'meck'
import { Events, Commands } from './types'
import {
  VueFile,
  resolveImportPath,
  parseVueFile,
  vueFileToPayload
} from '../parser/vue-file'
import { getNode as getTemplateNode } from '../parser/template/manipulate'
import { getNode as getStyleNode } from '../parser/style/manipulate'
import { Modifiers, modify } from '../parser/modifier'
import { insertComponentScript } from '../parser/script/modify'
import { insertToTemplate } from '../parser/template/modify'
import { updateDeclaration, insertDeclaration, removeDeclaration } from '../parser/style/modify'
import { mapValues } from '../utils'

export function observeServerEvents(
  bus: MessageBus<Events, Commands>,
  vueFiles: Record<string, VueFile>,
  activeUri: string | undefined
): void {
  let lastActiveUri: string | undefined = activeUri

  bus.on('initClient', () => {
    bus.emit('initProject', mapValues(vueFiles, vueFileToPayload))
    if (lastActiveUri) {
      bus.emit('changeDocument', lastActiveUri)
    }
  })

  bus.on('selectNode', payload => {
    const vueFile = vueFiles[payload.uri]
    if (!vueFile || !vueFile.template || payload.templatePath.length === 0) {
      return
    }

    const element = getTemplateNode(vueFile.template, payload.templatePath)
    if (!element) {
      return
    }

    const styleRules = payload.stylePaths
      .map(path => getStyleNode(vueFile.styles, path))
      .filter(<T>(n: T | undefined): n is T => n !== undefined)

    const highlightRanges = [element, ...styleRules].map(node => {
      return node.range
    })

    // Highlight matched ranges on editor
    bus.emit('highlightEditor', {
      uri: vueFile.uri.toString(),
      ranges: highlightRanges
    })
  })

  bus.on('addNode', payload => {
    const vueFile = vueFiles[payload.currentUri]
    if (!vueFile || !vueFile.template) return

    const component = vueFiles[payload.nodeUri]
    if (!component) return

    const existingComponent = vueFile.childComponents.find(child => {
      return child.uri === component.uri.toString()
    })

    const componentName = existingComponent
      ? existingComponent.name
      : component.name

    const modifier: Modifiers = [
      insertToTemplate(vueFile.template!, payload.path, `<${componentName} />`)
    ]

    if (!existingComponent) {
      modifier.push(
        insertComponentScript(
          vueFile.script,
          vueFile.code,
          componentName,
          resolveImportPath(vueFile, component)
        )
      )
    }

    const updated = modify(vueFile.code, modifier)
    const uri = vueFile.uri.toString()

    bus.emit('updateEditor', {
      uri,
      code: updated
    })

    // TODO: move mutation to outside of this logic
    vueFiles[uri] = parseVueFile(updated, uri)

    // TODO: change this notification more clean and optimized way
    bus.emit('initProject', mapValues(vueFiles, vueFileToPayload))
  })

  bus.on('changeActiveEditor', uri => {
    lastActiveUri = uri
    bus.emit('changeDocument', uri)
  })

  bus.on('updateEditor', ({ uri, code }) => {
    // TODO: move mutation to outside of this logic
    vueFiles[uri] = parseVueFile(code, uri)

    // TODO: change this notification more clean and optimized way
    bus.emit('initProject', mapValues(vueFiles, vueFileToPayload))
  })

  bus.on('addDocument', ({ uri, code }) => {
    // TODO: move mutation to outside of this logic
    vueFiles[uri] = parseVueFile(code, uri)

    // TODO: change this notification more clean and optimized way
    bus.emit('initProject', mapValues(vueFiles, vueFileToPayload))
  })

  bus.on('changeDocument', ({ uri, code }) => {
    // TODO: move mutation to outside of this logic
    vueFiles[uri] = parseVueFile(code, uri)

    // TODO: change this notification more clean and optimized way
    bus.emit('initProject', mapValues(vueFiles, vueFileToPayload))
  })

  bus.on('removeDocument', uri => {
    delete vueFiles[uri]

    // TODO: change this notification more clean and optimized way
    bus.emit('initProject', mapValues(vueFiles, vueFileToPayload))
  })

  bus.on('removeDeclaration', ({ uri, path }) => {
    const { code, styles } = vueFiles[uri]
    const removed = modify(code, [
      removeDeclaration(styles, path)
    ])

    bus.emit('updateEditor', {
      uri,
      code: removed
    })

    // TODO: move mutation to outside of this logic
    vueFiles[uri] = parseVueFile(removed, uri)

    // TODO: change this notification more clean and optimized way
    bus.emit('initProject', mapValues(vueFiles, vueFileToPayload))
  })

  bus.on('updateDeclaration', ({ uri, declaration }) => {
    const { code, styles } = vueFiles[uri]
    const updated = modify(code, [updateDeclaration(styles, declaration)])

    bus.emit('updateEditor', {
      uri,
      code: updated
    })

    // TODO: move mutation to outside of this logic
    vueFiles[uri] = parseVueFile(updated, uri)

    // TODO: change this notification more clean and optimized way
    bus.emit('initProject', mapValues(vueFiles, vueFileToPayload))
  })
}
