import {
  STStyle,
  STDeclarationForUpdate,
  STDeclarationForAdd,
  STDeclaration,
} from './types'
import { getDeclaration, getNode } from './manipulate'
import {
  Modifier,
  empty,
  replace,
  removeRange,
  insertBefore,
  insertAfter,
} from '../modifier'
import { genDeclaration, genRule } from './codegen'
import { clone } from '../../utils'

export function insertDeclaration(
  styles: STStyle[],
  decl: STDeclarationForAdd,
  to: number[],
): Modifier | Modifier[] {
  const target = getDeclaration(styles, to)
  if (target) {
    return insertBefore(
      target,
      genDeclaration(clone(target, decl)) + target.before,
    )
  }

  const parentPath = to.slice(0, -1)
  const last = to[to.length - 1]
  const before = getDeclaration(styles, parentPath.concat(last - 1))
  if (before) {
    return insertAfter(
      before,
      before.before + genDeclaration(clone(before, decl)),
    )
  }

  const rule = getNode(styles, parentPath)
  if (rule && rule.type === 'Rule') {
    const d: STDeclaration = {
      type: 'Declaration',
      path: to,
      before: '',
      range: [-1, -1],
      ...decl,
    }

    const inserted = clone(rule, {
      children: [
        ...rule.children.slice(last),
        d,
        ...rule.children.slice(last + 1),
      ],
    })

    return replace(rule, genRule(inserted))
  }

  return empty
}

export function removeDeclaration(styles: STStyle[], path: number[]): Modifier {
  const target = getDeclaration(styles, path)
  return target
    ? removeRange(target.range[0] - target.before.length, target.range[1])
    : empty
}

export function updateDeclaration(
  styles: STStyle[],
  decl: STDeclarationForUpdate,
): Modifier[] {
  const target = getDeclaration(styles, decl.path)
  return target ? replace(target, genDeclaration(clone(target, decl))) : [empty]
}
