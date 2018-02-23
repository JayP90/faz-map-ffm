if (!window._babelPolyfill) {
  require('babel-polyfill')
}

import Vue from 'vue'
import App from './App.vue'

new Vue({ // eslint-disable-line no-new
  el: '#faz-map-app',
  render: (h) => h(App)
})
