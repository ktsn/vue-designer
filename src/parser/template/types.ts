import { Range } from '../modifier'

export type ElementChild = Element | TextNode | ExpressionNode

interface BaseNode extends Range {
  type: string
}

export interface Template extends BaseNode {
  type: 'Template'
  attrs: Record<string, Attribute>
  children: ElementChild[]
}

export interface Element extends BaseNode {
  type: 'Element'
  path: number[]
  name: string
  startTag: StartTag
  endTag?: EndTag
  children: ElementChild[]
}

export interface StartTag extends BaseNode {
  type: 'StartTag'

  // It simply maps attributes with the following rule:
  // 1. Static attributes are mapped to `attrs`
  // 2. Normal v-bind attributes are mapped to `props`
  // 3. v-bind attributes having `prop` modifier are mapped to `domProps`
  // 4. Other directives are in `directives`
  // `attrs` and `props` may include `class` and `style` unlike Vue.js template compiler.
  // Object style v-bind (v-bind="obj") is not supported yet. It will be in `directives`.
  attrs: Record<string, Attribute>
  props: Record<string, Directive>
  domProps: Record<string, Directive>
  directives: Directive[]

  selfClosing: boolean
}

export interface EndTag extends BaseNode {
  type: 'EndTag'
}

export interface TextNode extends BaseNode {
  type: 'TextNode'
  path: number[]
  text: string
}

export interface ExpressionNode extends BaseNode {
  type: 'ExpressionNode'
  path: number[]
  expression: string
}

export interface Attribute extends BaseNode {
  type: 'Attribute'
  attrIndex: number
  name: string
  value?: string
}

export interface Directive extends BaseNode {
  type: 'Directive'
  attrIndex: number
  name: string
  argument?: string
  modifiers: Record<string, boolean>
  expression?: string
  value?: any
}

export interface VForDirective extends Directive {
  name: 'for'
  left: string[]
  right?: string
}
