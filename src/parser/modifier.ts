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

export function modify(code: string, modfiers: Modifiers): string {
  const ms = flatten(modfiers)

  function loop(
    acc: string,
    pos: number,
    cur: Modifier | undefined,
    rest: Modifier[]
  ): string {
    if (!cur) {
      return acc + code.slice(pos)
    }

    const pre = code.slice(pos, cur.pos)
    switch (cur.type) {
      case 'Add':
        return loop(acc + pre + cur.value, cur.pos, rest[0], rest.slice(1))
      case 'Remove':
        return loop(acc + pre, cur.pos + cur.length, rest[0], rest.slice(1))
      default:
        throw new Error(
          '[modifier] Unexpected modifier type: ' + (cur as any).type
        )
    }
  }
  return loop('', 0, ms[0], ms.slice(1))
}

export function insertBefore(node: Range, value: string): Modifier {
  return {
    type: 'Add',
    pos: node.range[0],
    value
  }
}

export function insertAfter(node: Range, value: string): Modifier {
  return {
    type: 'Add',
    pos: node.range[1],
    value
  }
}

export function remove(node: Range): Modifier {
  return {
    type: 'Remove',
    pos: node.range[0],
    length: node.range[1] - node.range[0]
  }
}

export function replace(node: Range, value: string): Modifier[] {
  return [remove(node), insertAfter(node, value)]
}
