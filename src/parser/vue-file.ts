import { Template } from './template'
import { Prop, Data } from './script'
import { parseComponent } from 'vue-template-compiler'
import { parse, AST } from 'vue-eslint-parser'
import { templateToPayload } from './template'
import { extractProps, extractData } from './script'

export interface VueFilePayload {
  template: Template | undefined
  props: Prop[]
  data: Data[]
  styles: string[]
}

export interface VueFile {
  template: (AST.VElement & AST.HasConcreteInfo) | undefined
  script: (AST.ESLintStatement | AST.ESLintModuleDeclaration)[]
  uri: string
}

export function parseVueFile(
  code: string,
  uri: string
): { payload: VueFilePayload; vueFile: VueFile } {
  const { styles } = parseComponent(code)
  const program = parse(code, { sourceType: 'module' })

  const vueFile = {
    template: program.templateBody,
    script: program.body,
    uri
  }

  const template = vueFile.template
    ? templateToPayload(vueFile.template, code)
    : undefined
  const props = extractProps(program.body)
  const data = extractData(program.body)

  const payload = {
    template,
    props,
    data,
    styles: styles.map((s: any) => s.content)
  }

  return {
    payload,
    vueFile
  }
}
