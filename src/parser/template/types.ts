import { Range } from '../modifier'

export type ElementChild = Element | TextNode | ExpressionNode

interface BaseNode extends Range {
  type: string
}

export interface Template extends BaseNode {
  type: 'Template'
  attributes: Attribute[]
  children: ElementChild[]
}

export interface Element extends BaseNode {
  type: 'Element'
  path: number[]
  name: string
  startTag: StartTag
  endTag: EndTag | null
  children: ElementChild[]
}

export interface StartTag extends BaseNode {
  type: 'StartTag'
  attributes: (Attribute | Directive)[]
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
  directive: false
  index: number
  name: string
  value: string | null
}

export interface Directive extends BaseNode {
  type: 'Attribute'
  directive: true
  index: number
  name: string
  argument: string | null
  modifiers: string[]
  expression: string | null
  value?: any
}

export interface VForDirective extends Directive {
  name: 'for'
  left: string[]
  right: string | null
}
