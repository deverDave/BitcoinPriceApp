import Vue from 'vue'
import App from './App.vue'

require('./assets/app.css');

new Vue({
  el: '#app',
  render: h => h(App)
})
