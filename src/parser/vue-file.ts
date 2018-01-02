import { Template } from './template'
import { Prop, Data } from './script'

export interface VueFile {
  template: Template | undefined
  props: Prop[]
  data: Data[]
  styles: string[]
}
