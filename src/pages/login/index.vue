<template>
  <view class="login-page">
    <!-- Logo和标题 -->
    <view class="logo">
      <text class="logo-text">家有小账本</text>
    </view>
    
    <!-- 表单区域 -->
    <view class="form-section">
      <!-- <view class="form-title">欢迎回来</view> -->
      
      <nut-form :model="formData" ref="formRef">
        <!-- 用户名输入 -->
        <nut-form-item 
          label="用户名" 
          prop="username" 
          :rules="[{ required: true, message: '请输入用户名' }, { min: 6, max: 20, message: '用户名长度为6-20个字符' }]"
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
          <view class="remember-me">
            <nut-checkbox v-model="formData.rememberMe" />
            <text class="remember-text">记住我</text>
          </view>
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
import './index.scss';

// 表单数据
const formData = reactive({
  username: '',
  password: '',
  rememberMe: false
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
  
  const valid = await formRef.value.validate();
  if (!valid) return;
  
  // 设置加载状态
  loading.value = true;
  
  try {
    // 登录请求参数
    const params: LoginParams = {
      username: formData.username,
      password: formData.password
    };
    
    // 发起登录请求
    const response = await login(params);
    
    // 登录成功，保存Token和用户信息
    Taro.setStorageSync('token', response.data?.token || '');
    Taro.setStorageSync('userInfo', response.data?.user || {});
    
    // 如果勾选了记住我，保存用户名
    if (formData.rememberMe) {
      Taro.setStorageSync('rememberedUsername', formData.username);
    } else {
      Taro.removeStorageSync('rememberedUsername');
    }
    
    // 跳转到首页
    Taro.switchTab({
      url: '/pages/index/index'
    });
    
    openToast('success', '登录成功');
  } catch (error: any) {
    openToast('fail', error.message || '登录失败，请重试');
  } finally {
    // 关闭加载状态
    loading.value = false;
  }
};

const openToast = (type: 'success' | 'fail', msg: string, cover = false) => {
  state.show = true
  state.msg = msg
  state.type = type
  state.cover = cover
}
const onClosed = () => console.log('closed')

// 初始化，从本地存储获取记住的用户名
const init = () => {
  const rememberedUsername = Taro.getStorageSync('rememberedUsername');
  if (rememberedUsername) {
    formData.username = rememberedUsername;
    formData.rememberMe = true;
  }
};

// 页面加载时初始化
init();

// 跳转到注册页面
const navigateToRegister = () => {
  Taro.redirectTo({
    url: '/pages/register/index'
  });
};
</script>