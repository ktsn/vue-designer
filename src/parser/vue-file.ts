import { URL } from 'url'
import * as path from 'path'
import { parse } from '@vue/compiler-sfc'
import { parse as parseTemplate } from 'vue-eslint-parser'
import { parse as parseScript } from '@babel/parser'
import * as Babel from '@babel/types'
import postcssParse from 'postcss-safe-parser'
import hashsum from 'hash-sum'
import { TETemplate } from './template/types'
import { transformTemplate } from './template/transform'
import { resolveAsset as resolveTemplateAsset } from './template/manipulate'
import { Prop, Data, ChildComponent } from './script/types'
import {
  extractChildComponents,
  extractProps,
  extractData,
} from './script/manipulate'
import { STStyle } from './style/types'
import { resolveAsset as resolveStyleAsset } from './style/manipulate'
import { transformStyle } from './style/transform'
import { AssetResolver } from '../asset-resolver'

export interface VueFilePayload {
  uri: string
  template: TETemplate | undefined
  props: Prop[]
  data: Data[]
  childComponents: ChildComponent[]
  styles: STStyle[]
  scopeId: string
}

export interface VueFile {
  uri: URL
  name: string
  code: string
  template: TETemplate | undefined
  script: Babel.Program
  props: Prop[]
  data: Data[]
  childComponents: ChildComponent[]
  styles: STStyle[]
}

export function parseVueFile(code: string, uri: string): VueFile {
  const parsedUri = new URL(uri)
  const name = path.basename(parsedUri.pathname).replace(/\..+$/, '')

  const {
    descriptor: { script, styles },
  } = parse(code, { pad: 'space' })

  const { program: scriptBody } = parseScript(script ? script.content : '', {
    sourceType: 'module',
    plugins: ['typescript', 'objectRestSpread'],
  })

  const childComponents = extractChildComponents(
    scriptBody,
    uri,
    (childPath) => {
      const resolved = new URL(parsedUri.toString())
      const dirPath = path.dirname(resolved.pathname)
      resolved.pathname = path
        .resolve(dirPath, childPath)
        .split(path.sep)
        .join('/')
      return resolved.toString()
    },
  )

  const styleAsts = styles.map((s, i) => {
    return transformStyle(postcssParse(s.content), s.content, i)
  })

  return {
    uri: parsedUri,
    name,
    code,
    template: parseTemplateBlock(code),
    script: scriptBody,
    props: extractProps(scriptBody),
    data: extractData(scriptBody),
    childComponents,
    styles: styleAsts,
  }
}

export function vueFileToPayload(
  vueFile: VueFile,
  assetResolver: AssetResolver,
): VueFilePayload {
  const scopeId = hashsum(vueFile.uri.toString())
  const basePath = path.dirname(vueFile.uri.pathname)

  return {
    uri: vueFile.uri.toString(),
    scopeId,
    template:
      vueFile.template &&
      resolveTemplateAsset(vueFile.template, basePath, assetResolver),
    props: vueFile.props,
    data: vueFile.data,
    childComponents: vueFile.childComponents,
    styles: vueFile.styles.map((s) =>
      resolveStyleAsset(s, basePath, assetResolver),
    ),
  }
}

function parseTemplateBlock(template: string): TETemplate | undefined {
  // TODO: Use parsed SFCBlock after it is fixed that the issue vue-template-compiler
  // breaks original source position by deindent
  const code = template.replace(/<script.*>[\s\S]*<\/script>/, (matched) => {
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
