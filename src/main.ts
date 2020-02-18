import Vue from 'vue';
import App from './App.vue';
import store from './store';
// eslint-disable-next-line
// @ts-ignore
import vuescroll from 'vue-scroll';

Vue.use(vuescroll, { debounce: 50 });

Vue.config.productionTip = false

new Vue({
  store,
  render: h => h(App)
}).$mount('#app')
