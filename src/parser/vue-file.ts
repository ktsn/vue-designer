import { Template } from './template'
import { Prop, Data } from './script'
import { parseComponent } from 'vue-template-compiler'
import { parse as eslintParse, AST } from 'vue-eslint-parser'
import postcssParse from 'postcss-safe-parser'
import hashsum from 'hash-sum'
import { transformTemplate } from './template'
import { extractProps, extractData } from './script'
import { Style, transformStyle, Rule } from './style'
import { createStyleMatcher } from './style-matcher'

export interface VueFilePayload {
  uri: string
  template: Template | undefined
  props: Prop[]
  data: Data[]
  styles: Style
  scopeId: string
}

export interface VueFile {
  uri: string
  template: Template | undefined
  script: (AST.ESLintStatement | AST.ESLintModuleDeclaration)[]
  styles: Style
  matchSelector: (template: Template, targetPath: number[]) => Rule[]
}

export function parseVueFile(code: string, uri: string): VueFile {
  const stylesCode: string = parseComponent(code, { pad: 'space' })
    .styles.map((s: any) => s.content)
    .join('\n')

  const { templateBody, body: scriptBody } = eslintParse(code, {
    sourceType: 'module'
  })

  const styleBody = postcssParse(stylesCode)

  const template = templateBody
    ? transformTemplate(templateBody, code)
    : undefined
  const styles = transformStyle(styleBody, stylesCode)

  return {
    uri,
    template,
    script: scriptBody,
    styles,
    matchSelector: createStyleMatcher(styles)
  }
}

export function vueFileToPayload(vueFile: VueFile): VueFilePayload {
  const props = extractProps(vueFile.script)
  const data = extractData(vueFile.script)
  const scopeId = hashsum(vueFile.uri)

  return {
    uri: vueFile.uri,
    scopeId,
    template: vueFile.template,
    props,
    data,
    styles: vueFile.styles
  }
}
