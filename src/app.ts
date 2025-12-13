import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Taro from '@tarojs/taro'
import { updateManager } from './utils/update-manager'
import { isTokenExpired, redirectToLogin } from './utils/auth'
import './app.scss'

const App = createApp({
  onShow(options) {
    updateManager()
  },
  onLaunch() {
    // 应用初始化时执行登录状态验证
    const token = Taro.getStorageSync('token');
    
    if (!token) {
      // 无 token，跳转到登录页
      redirectToLogin();
    } else if (isTokenExpired(token)) {
      // token 已过期，清除并跳转到登录页
      Taro.removeStorageSync('token');
      Taro.removeStorageSync('userInfo');
      redirectToLogin();
    }
  },
  // 入口组件不需要实现 render 方法，即使实现了也会被 taro 所覆盖
})

App.use(createPinia())

export default App
