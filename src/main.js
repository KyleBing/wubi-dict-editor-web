import Vue from 'vue'
import App from './App.vue'
import Moment from "moment"

// 全局配置 moment，设置星期的第一天为 星期一
Moment.locale('zh', {
   week: {
      dow: 1
   }
})

// vur-virtual-scroller css
import  "../node_modules/vue-virtual-scroller/dist/vue-virtual-scroller.css"

// icons
import icons from "@/assets/img/SvgIcons"
Vue.prototype.$icons = icons


new Vue({
   render: h => h(App)
}).$mount('#app')


// 开发相关
Vue.config.productionTip = false
Vue.config.devtools = true  // Vue Devtools Chrome 插件支持
document.addEventListener("touchstart", function() {},false) // 使移动端支持 :hover 样式
