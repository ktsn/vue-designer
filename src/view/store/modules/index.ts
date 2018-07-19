import { module } from 'sinai'
import { project } from './project'
import { viewport } from './viewport'
import { guide } from './guide'

export default module()
  .child('project', project)
  .child('viewport', viewport)
  .child('guide', guide)
