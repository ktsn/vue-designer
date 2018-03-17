import { Style, DeclarationForUpdate } from './types'
import { getDeclaration } from './manipulate'
import { Modifier, empty, replace } from '../modifier'
import { genDeclaration } from './codegen'
import { clone } from '../../utils'

export function updateDeclaration(
  styles: Style[],
  decl: DeclarationForUpdate
): Modifier[] {
  const target = getDeclaration(styles, decl.path)

  if (!target) {
    return [empty]
  }

  return replace(target, genDeclaration(clone(target, decl)))
}
