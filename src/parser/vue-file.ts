import { URL } from 'url'
import * as path from 'path'
import { parseComponent } from 'vue-template-compiler'
import { parse as parseTemplate } from 'vue-eslint-parser'
import { parse as parseScript } from 'babylon'
import * as Babel from 'babel-types'
import postcssParse from 'postcss-safe-parser'
import hashsum from 'hash-sum'
import { Template, transformTemplate } from './template'
import {
  Prop,
  Data,
  ChildComponent,
  extractChildComponents,
  extractProps,
  extractData
} from './script'
import { Style, transformStyle, Rule } from './style'
import { createStyleMatcher } from './style-matcher'

export interface VueFilePayload {
  uri: string
  template: Template | undefined
  props: Prop[]
  data: Data[]
  childComponents: ChildComponent[]
  styles: Style[]
  scopeId: string
}

export interface VueFile {
  uri: URL
  name: string
  template: Template | undefined
  script: Babel.Program
  props: Prop[]
  data: Data[]
  childComponents: ChildComponent[]
  styles: Style[]
  matchSelector: (template: Template, targetPath: number[]) => Rule[]
}

export function parseVueFile(code: string, uri: string): VueFile {
  const parsedUri = new URL(uri)
  const name = path.basename(parsedUri.pathname).replace(/\..+$/, '')

  const { script, styles } = parseComponent(code, { pad: 'space' })

  const { program: scriptBody } = parseScript(script ? script.content : '', {
    sourceType: 'module',
    plugins: ['typescript', 'objectRestSpread'],
    ranges: true
  } as any)

  const childComponents = extractChildComponents(scriptBody, uri, childPath => {
    const resolved = new URL(parsedUri.toString())
    const dirPath = path.dirname(resolved.pathname)
    resolved.pathname = path
      .resolve(dirPath, childPath)
      .split(path.sep)
      .join('/')
    return resolved.toString()
  })

  const styleAsts = styles.map(s => {
    return transformStyle(postcssParse(s.content), s.content)
  })

  return {
    uri: parsedUri,
    name,
    template: parseTemplateBlock(code),
    script: scriptBody,
    props: extractProps(scriptBody),
    data: extractData(scriptBody),
    childComponents,
    styles: styleAsts,
    matchSelector: createStyleMatcher(styleAsts)
  }
}

export function vueFileToPayload(vueFile: VueFile): VueFilePayload {
  const scopeId = hashsum(vueFile.uri)

  return {
    uri: vueFile.uri.toString(),
    scopeId,
    template: vueFile.template,
    props: vueFile.props,
    data: vueFile.data,
    childComponents: vueFile.childComponents,
    styles: vueFile.styles
  }
}

function parseTemplateBlock(template: string): Template | undefined {
  // TODO: Use parsed SFCBlock after it is fixed that the issue vue-template-compiler
  // breaks original source position by deindent
  const code = template.replace(/<script.*>[\s\S]*<\/script>/, matched => {
    return matched.replace(/./g, ' ')
  })

  const { templateBody } = parseTemplate(code, {})

  return templateBody && transformTemplate(templateBody, code)
}

export function resolveImportPath(from: VueFile, to: VueFile): string {
  const fromPath = path.dirname(from.uri.pathname)
  const toPath = to.uri.pathname
  const componentPath = path.relative(fromPath, toPath)
  return componentPath.startsWith('.') ? componentPath : './' + componentPath
}
