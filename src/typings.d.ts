declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}

declare module 'postcss-safe-parser' {
  import { parse } from 'postcss'
  export default parse
}

declare module 'vue-template-compiler'
