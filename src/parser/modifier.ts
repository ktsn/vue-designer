import { flatten } from '../utils'

export type Modifiers = (Modifier | Modifier[])[]

export type Modifier = Add | Remove

export interface Range {
  range: [number, number]
}

interface Add {
  type: 'Add'
  pos: number
  value: string
}

interface Remove {
  type: 'Remove'
  pos: number
  length: number
}

export const empty = insertAt(0, '')
export const singleIndentStr = '  '

export function modify(code: string, modfiers: Modifiers): string {
  const ms = flatten(modfiers).sort(modifierComperator)

  function loop(
    acc: string,
    pos: number,
    cur: Modifier | undefined,
    rest: Modifier[],
  ): string {
    if (!cur) {
      return acc + code.slice(pos)
    }

    // Fix the current position to resolve overwraps of nodes.
    // e.g.
    //  remove: [4, 8] -> insert: 6
    //  then insert position will be 8.
    const fixedPos = pos <= cur.pos ? cur.pos : pos
    const pre = code.slice(pos, fixedPos)
    switch (cur.type) {
      case 'Add':
        return loop(acc + pre + cur.value, fixedPos, rest[0], rest.slice(1))
      case 'Remove':
        const endPos = cur.pos + cur.length
        const fixedEnd = pos <= endPos ? endPos : pos
        return loop(acc + pre, fixedEnd, rest[0], rest.slice(1))
      default:
        throw new Error(
          '[modifier] Unexpected modifier type: ' + (cur as any).type,
        )
    }
  }
  return loop('', 0, ms[0], ms.slice(1))
}

export function reduce<T>(
  modifiers: Modifiers,
  fn: (acc: T, modifier: Modifier) => T,
  initial: T,
): T {
  const ms = flatten(modifiers).sort(modifierComperator)
  return ms.reduce(fn, initial)
}

function modifierComperator(a: Modifier, b: Modifier): number {
  if (a.pos < b.pos) {
    return -1
  } else if (a.pos > b.pos) {
    return 1
  } else {
    return 0
  }
}

export function insertAt(pos: number, value: string): Modifier {
  return {
    type: 'Add',
    pos,
    value,
  }
}

export function insertBefore(node: Range, value: string): Modifier {
  return insertAt(node.range[0], value)
}

export function insertAfter(node: Range, value: string): Modifier {
  return insertAt(node.range[1], value)
}

export function removeRange(from: number, to: number): Modifier {
  return {
    type: 'Remove',
    pos: from,
    length: to - from,
  }
}

export function remove(node: Range): Modifier {
  return removeRange(node.range[0], node.range[1])
}

export function replace(node: Range, value: string): Modifier[] {
  return [remove(node), insertAfter(node, value)]
}
