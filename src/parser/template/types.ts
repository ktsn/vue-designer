import { Range } from '../modifier'

export type TEChild = TEElement | TETextNode | TEExpressionNode

interface TEBaseNode extends Range {
  type: string
}

export interface TETemplate extends TEBaseNode {
  type: 'Template'
  attrs: Record<string, TEAttribute>
  children: TEChild[]
}

export interface TEElement extends TEBaseNode {
  type: 'Element'
  path: number[]
  name: string
  startTag: TEStartTag
  endTag?: TEEndTag
  children: TEChild[]
}

export interface TEStartTag extends TEBaseNode {
  type: 'StartTag'

  // It simply maps attributes with the following rule:
  // 1. Static attributes are mapped to `attrs`
  // 2. Normal v-bind attributes are mapped to `props`
  // 3. v-bind attributes having `prop` modifier are mapped to `domProps`
  // 4. Other directives are in `directives`
  // `attrs` and `props` may include `class` and `style` unlike Vue.js template compiler.
  // Object style v-bind (v-bind="obj") is not supported yet. It will be in `directives`.
  attrs: Record<string, TEAttribute>
  props: Record<string, TEDirective>
  domProps: Record<string, TEDirective>
  directives: TEDirective[]

  selfClosing: boolean
}

export interface TEEndTag extends TEBaseNode {
  type: 'EndTag'
}

export interface TETextNode extends TEBaseNode {
  type: 'TextNode'
  path: number[]
  text: string
}

export interface TEExpressionNode extends TEBaseNode {
  type: 'ExpressionNode'
  path: number[]
  expression: string
}

export interface TEAttribute extends TEBaseNode {
  type: 'Attribute'
  attrIndex: number
  name: string
  value?: string
}

export interface TEDirective extends TEBaseNode {
  type: 'Directive'
  attrIndex: number
  name: string
  argument?: string
  modifiers: Record<string, boolean>
  expression?: string
  value?: any
}

export interface TEForDirective extends TEDirective {
  name: 'for'
  left: string[]
  right?: string
}
