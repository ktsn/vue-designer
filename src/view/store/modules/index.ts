import { module } from 'sinai'
import { project } from './project'
import { viewport } from './viewport'

export default module()
  .child('project', project)
  .child('viewport', viewport)
