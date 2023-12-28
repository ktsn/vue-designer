declare module 'postcss-safe-parser' {
  import { parse } from 'postcss'
  const parser: typeof parse
  export default parser
}
