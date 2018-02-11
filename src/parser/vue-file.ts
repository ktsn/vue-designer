import { Template } from './template'
import { Prop, Data } from './script'
import { parseComponent } from 'vue-template-compiler'
import { parse as eslintParse, AST } from 'vue-eslint-parser'
import postcss from 'postcss'
import postcssParse from 'postcss-safe-parser'
import hashsum from 'hash-sum'
import { transformTemplate } from './template'
import { extractProps, extractData } from './script'
import { Style, transformStyle } from './style'

export interface VueFilePayload {
  id: string
  template: Template | undefined
  props: Prop[]
  data: Data[]
  styles: Style
}

export interface VueFile {
  id: string
  template: Template | undefined
  script: (AST.ESLintStatement | AST.ESLintModuleDeclaration)[]
  style: postcss.Root
  uri: string
}

export function parseVueFile(
  code: string,
  uri: string
): { payload: VueFilePayload; vueFile: VueFile } {
  const id = hashsum(uri)
  const stylesCode: string = parseComponent(code)
    .styles.map((s: any) => s.content)
    .join('\n')

  const { templateBody, body: scriptBody } = eslintParse(code, {
    sourceType: 'module'
  })

  const styleBody = postcssParse(stylesCode)

  const template = templateBody
    ? transformTemplate(templateBody, code)
    : undefined
  const props = extractProps(scriptBody)
  const data = extractData(scriptBody)
  const styles = transformStyle(styleBody)

  const vueFile = {
    id,
    template,
    script: scriptBody,
    style: styleBody,
    uri
  }

  const payload = {
    id,
    template,
    props,
    data,
    styles
  }

  return {
    payload,
    vueFile
  }
}
