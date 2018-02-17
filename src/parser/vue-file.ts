import { URL } from 'url'
import * as path from 'path'
import { parseComponent } from 'vue-template-compiler'
import { parse as eslintParse } from 'vue-eslint-parser'
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
  uri: string
  template: Template | undefined
  props: Prop[]
  data: Data[]
  childComponents: ChildComponent[]
  styles: Style[]
  matchSelector: (template: Template, targetPath: number[]) => Rule[]
}

export function parseVueFile(code: string, uri: string): VueFile {
  const { styles } = parseComponent(code, { pad: 'space' })

  const { templateBody, body: scriptBody } = eslintParse(code, {
    sourceType: 'module'
  })

  const props = extractProps(scriptBody)
  const data = extractData(scriptBody)
  const childComponents = extractChildComponents(scriptBody, childPath => {
    const parsedUri = new URL(uri)
    const dirPath = path.dirname(parsedUri.pathname)
    parsedUri.pathname = path
      .resolve(dirPath, childPath)
      .split(path.sep)
      .join('/')
    return parsedUri.toString()
  })

  const styleAsts = styles.map(s => {
    return transformStyle(postcssParse(s.content), s.content)
  })

  return {
    uri,
    template: templateBody && transformTemplate(templateBody, code),
    props,
    data,
    childComponents,
    styles: styleAsts,
    matchSelector: createStyleMatcher(styleAsts)
  }
}

export function vueFileToPayload(vueFile: VueFile): VueFilePayload {
  const scopeId = hashsum(vueFile.uri)

  return {
    uri: vueFile.uri,
    scopeId,
    template: vueFile.template,
    props: vueFile.props,
    data: vueFile.data,
    childComponents: vueFile.childComponents,
    styles: vueFile.styles
  }
}
