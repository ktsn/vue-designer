import { Style, DeclarationForUpdate } from './types'
import { getDeclaration } from './manipulate'
import { Modifier, empty, replace, removeRange } from '../modifier'
import { genDeclaration } from './codegen'
import { clone } from '../../utils'

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
