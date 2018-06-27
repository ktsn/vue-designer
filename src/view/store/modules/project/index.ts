import { module } from 'sinai'
import { ProjectState } from './project-state'
import { ProjectGetters } from './project-getters'
import { ProjectMutations } from './project-mutations'
import { ProjectActions } from './project-actions'

export const project = module({
  state: ProjectState,
  getters: ProjectGetters,
  mutations: ProjectMutations,
  actions: ProjectActions
})
