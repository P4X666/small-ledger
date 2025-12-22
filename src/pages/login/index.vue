<template>
  <view class="login-page" :style="{ paddingTop: `${navigationBarHeight}px` }">
    <!-- Logo和标题 -->
    <view class="logo">
      <text class="logo-text">家有小账本</text>
    </view>
    
    <!-- 表单区域 -->
    <view class="form-section">
      <!-- <view class="form-title">欢迎回来</view> -->
      
      <nut-form :model-value="formData" ref="formRef">
        <!-- 用户名输入 -->
        <nut-form-item 
          label="用户名" 
          prop="username" 
          :rules="[{ required: true, message: '请输入用户名' }, { min: 6, max: 20, message: '用户名长度为6-20个字符' }]"
          :show-error-message="false"
        >
          <nut-input 
            v-model="formData.username" 
            placeholder="请输入用户名" 
            clearable 
            maxlength="20"
          />
        </nut-form-item>
        
        <!-- 密码输入 -->
        <nut-form-item 
          label="密码" 
          prop="password" 
          :rules="[{ required: true, message: '请输入密码' }, { min: 8, max: 20, message: '密码长度为8-20个字符' }]"
          :show-error-message="false"
        >
          <nut-input 
            v-model="formData.password" 
            placeholder="请输入密码" 
            type="password" 
            clearable 
            maxlength="20"
            :show-password="showPassword"
            @click:show-password="showPassword = !showPassword"
          />
        </nut-form-item>
        
        <!-- 记住我和忘记密码 -->
        <view class="remember-forgot">
          <text class="forgot-password">忘记密码？</text>
        </view>
        
        <!-- 登录按钮 -->
        <view class="login-button">
          <nut-button 
            type="primary" 
            block 
            @click="handleLogin" 
            :loading="loading"
            :disabled="loading"
          >
            登录
          </nut-button>
        </view>
        <!-- 切换到注册页面 -->
        <view class="switch-page">
          <view class="switch-text">
            还没有账号？
            <view class="switch-link" @click="navigateToRegister">立即注册</view>
          </view>
        </view>
      </nut-form>
      
    </view>
  </view>
  <nut-toast :msg="state.msg" v-model:visible="state.show" :type="state.type" @closed="onClosed" :cover="state.cover" />
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import Taro from '@tarojs/taro';
import { login, LoginParams } from '@/api/auth';
import { useNavigationBar } from '@/utils/navigation';
import './index.scss';

// 使用顶部栏高度管理组合式函数
const { navigationBarHeight } = useNavigationBar();

// 表单数据
const formData = reactive({
  username: '',
  password: ''
});

const state = reactive({
  msg: '',
  type: 'text',
  show: false,
  cover: false,
  center: true
})

// 显示密码
const showPassword = ref(false);

// 加载状态
const loading = ref(false);

// 表单引用
const formRef = ref<any>(null);

// 登录处理
const handleLogin = async () => {
  // 表单验证
  if (!formRef.value) return;
  formRef.value.validate().then(async ({ valid, errors }) => {
    if (valid) {
      try {
        // 设置加载状态
        loading.value = true;
        // 登录请求参数
        const params: LoginParams = {
          username: formData.username,
          password: formData.password,
        };

        // 发起登录请求
        await login(params);
        
        // 跳转到首页
        Taro.switchTab({
          url: '/pages/index/index'
        });
        loading.value = false;
      } catch (error: any) {
        openToast('fail', error.message || '登录失败，请重试');
        // 关闭加载状态
        loading.value = false;
      }
      return
    }
    console.error(errors);
  });
};

const openToast = (type: 'success' | 'fail', msg: string, cover = false) => {
  state.show = true
  state.msg = msg
  state.type = type
  state.cover = cover
}
const onClosed = () => console.log('closed')

// 跳转到注册页面
const navigateToRegister = () => {
  Taro.redirectTo({
    url: '/pages/register/index'
  });
};
</script>