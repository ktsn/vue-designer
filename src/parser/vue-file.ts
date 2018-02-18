import { URL } from 'url'
import * as path from 'path'
import { parseComponent } from 'vue-template-compiler'
import { parse as parseTemplate } from 'vue-eslint-parser'
import { parse as parseScript } from 'babylon'
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
  const { script, styles } = parseComponent(code, { pad: 'space' })

  const { program: scriptBody } = parseScript(script ? script.content : '', {
    sourceType: 'module',
    plugins: ['typescript', 'objectRestSpread'] as any[]
  })

  const childComponents = extractChildComponents(scriptBody, uri, childPath => {
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
    template: parseTemplateBlock(code),
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
    uri: vueFile.uri,
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
