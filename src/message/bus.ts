import { MessageBus } from 'meck'
import { Events, Commands } from './types'
import {
  VueFile,
  resolveImportPath,
  parseVueFile,
  vueFileToPayload
} from '../parser/vue-file'
import { transformRuleForPrint } from '../parser/style/transform'
import { getNode } from '../parser/template/manipulate'
import {
  Modifiers,
  insertToTemplate,
  insertComponentScript,
  modify
} from '../parser/modifier'
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
    if (!vueFile || !vueFile.template || payload.path.length === 0) {
      return
    }

    const element = getNode(vueFile.template, payload.path)
    if (!element) {
      return
    }

    const styleRules = vueFile.matchSelector(vueFile.template, payload.path)
    const highlightRanges = [element, ...styleRules].map(node => {
      return node.range
    })

    // Notify matched rules to client
    bus.emit('matchRules', styleRules.map(transformRuleForPrint))

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
}
