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
  attrs: Record<string, Attribute>
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
