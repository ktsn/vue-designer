/* eslint-disable typescript/no-empty-interface */
interface RecordDefaultValue extends Record<string, DefaultValue> {}
interface ArrayDefaultValue extends Array<DefaultValue> {}
/* eslint-enable typescript/no-empty-interface */

export type DefaultValue =
  | RecordDefaultValue
  | ArrayDefaultValue
  | boolean
  | number
  | string
  | null
  | undefined

export interface Prop {
  name: string
  type: string
  default?: DefaultValue
}

export interface Data {
  name: string
  default?: DefaultValue
}

export interface ChildComponent {
  name: string
  uri: string
}
