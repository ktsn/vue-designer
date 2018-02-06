declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}

declare module 'postcss-safe-parser' {
  import { parse } from 'postcss'
  export = parse
}

declare module 'vue-template-compiler'
