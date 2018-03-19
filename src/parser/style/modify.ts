import {
  Style,
  DeclarationForUpdate,
  DeclarationForAdd,
  Declaration
} from './types'
import { getDeclaration, getNode } from './manipulate'
import {
  Modifier,
  empty,
  replace,
  removeRange,
  insertBefore,
  insertAfter
} from '../modifier'
import { genDeclaration, genRule } from './codegen'
import { clone } from '../../utils'

export function insertDeclaration(
  styles: Style[],
  decl: DeclarationForAdd,
  to: number[]
): Modifier | Modifier[] {
  const target = getDeclaration(styles, to)
  if (target) {
    return insertBefore(
      target,
      genDeclaration(clone(target, decl)) + target.before
    )
  }

  const parentPath = to.slice(0, -1)
  const last = to[to.length - 1]
  const before = getDeclaration(styles, parentPath.concat(last - 1))
  if (before) {
    return insertAfter(
      before,
      before.before + genDeclaration(clone(before, decl))
    )
  }

  const rule = getNode(styles, parentPath)
  if (rule && rule.type === 'Rule') {
    const d: Declaration = {
      type: 'Declaration',
      path: to,
      before: '',
      after: '',
      range: [-1, -1],
      ...decl
    }

    const inserted = clone(rule, {
      declarations: [
        ...rule.declarations.slice(last),
        d,
        ...rule.declarations.slice(last + 1)
      ]
    })

    return replace(rule, genRule(inserted))
  }

  return empty
}

export function removeDeclaration(styles: Style[], path: number[]): Modifier {
  const target = getDeclaration(styles, path)
  return target
    ? removeRange(target.range[0] - target.before.length, target.range[1])
    : empty
}

export function updateDeclaration(
  styles: Style[],
  decl: DeclarationForUpdate
): Modifier[] {
  const target = getDeclaration(styles, decl.path)
  return target ? replace(target, genDeclaration(clone(target, decl))) : [empty]
}
