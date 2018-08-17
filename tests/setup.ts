import Vue from 'vue'
import { config } from '@vue/test-utils'
import { install } from 'sinai'

Vue.config.productionTip = false
Vue.config.devtools = false

config.logModifiedComponents = false

Vue.use(install)
