export function selectNodeContents(el: Node): void {
  // Skip if selection does not exist (in case of testing environment)
  if (!('getSelection' in window)) return

  const selection = window.getSelection()
  const range = new Range()
  range.selectNodeContents(el)
  selection.removeAllRanges()
  selection.addRange(range)
}
