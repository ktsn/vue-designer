import { lexStyleValue, lexToString } from './style-value-lexer'

export function selectNodeContents(el: Node): void {
  // Skip if selection does not exist (in case of testing environment)
  if (!('getSelection' in window)) return

  const selection = window.getSelection()
  if (selection) {
    const range = new Range()
    range.selectNodeContents(el)
    selection.removeAllRanges()
    selection.addRange(range)
  }
}

export function getTextOffset(node: Node, offset?: number): number {
  if (node.nodeType === Node.TEXT_NODE) {
    return offset !== undefined ? offset : (node as Text).wholeText.length
  }

  if (
    node.nodeType === Node.COMMENT_NODE ||
    node.nodeType === Node.CDATA_SECTION_NODE
  ) {
    // Ignore comments and cdata...
    return 0
  }

  const targetChildren =
    offset !== undefined
      ? Array.from(node.childNodes).slice(0, offset)
      : Array.from(node.childNodes)

  return targetChildren.reduce((acc, c) => {
    return acc + getTextOffset(c)
  }, 0)
}

export function updateStyleValue(
  value: string,
  position: number,
  offset: number,
): {
  value: string
  range?: [number, number]
} {
  return lexStyleValue(value).reduce(
    (acc, n) => {
      if (n.range[0] <= position && position < n.range[1]) {
        if (n.type === 'numeric') {
          const updated = {
            ...n,
            value: n.value + offset,
          }

          const str = lexToString(updated)

          return {
            value: acc.value + str,
            range: [acc.value.length, acc.value.length + str.length],
          }
        }
      }
      return {
        ...acc,
        value: acc.value + lexToString(n),
      }
    },
    {
      value: '',
    },
  )
}
