import './lib/drag-and-drop'
import './load-icons'

import Vue from 'vue'
import App from './App.vue'
import { store } from './store'

new Vue({
  el: '#app',
  store,
  render: h => h(App)
})
