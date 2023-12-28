import './global.css'
import './lib/drag-and-drop'
import './load-icons'

import { createApp } from 'vue'
import App from './App.vue'
import { store } from './store'

const app = createApp(App)
app.use(store)
app.mount('#app')
