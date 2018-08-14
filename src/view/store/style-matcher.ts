import { STStyle, STRule } from '@/parser/style/types'
import { TETemplate } from '@/parser/template/types'
import { createStyleMatcher } from '@/parser/style/match'

type Matcher = (template: TETemplate, path: number[]) => STRule[]

export class StyleMatcher {
  private matchers = new Map<string, Matcher>()

  match(uri: string, template: TETemplate, path: number[]): STRule[] {
    const matcher = this.matchers.get(uri)
    if (!matcher) {
      return []
    }
    return matcher(template, path)
  }

  register(uri: string, styles: STStyle[]): void {
    const matcher = createStyleMatcher(styles)
    this.matchers.set(uri, matcher)
  }

  unregister(uri: string): void {
    this.matchers.delete(uri)
  }

  clear(): void {
    this.matchers.clear()
  }
}
