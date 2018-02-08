declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}

declare module 'postcss-safe-parser' {
  import { parse } from 'postcss'
  const parser: typeof parse
  export = parser
}

declare module 'vue-template-compiler'
