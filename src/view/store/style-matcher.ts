import { Style, Rule } from '@/parser/style/types'
import { Template } from '@/parser/template/types'
import { createStyleMatcher } from '@/parser/style/match'

type Matcher = (template: Template, path: number[]) => Rule[]

export class StyleMatcher {
  private matchers = new Map<string, Matcher>()

  match(uri: string, template: Template, path: number[]): Rule[] {
    const matcher = this.matchers.get(uri)
    if (!matcher) {
      return []
    }
    return matcher(template, path)
  }

  register(uri: string, styles: Style[]): void {
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
