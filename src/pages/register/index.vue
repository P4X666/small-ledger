<template>
  <view class="register-page">
    <!-- Logo和标题 -->
    <view class="logo">
      <text class="logo-text">家有小账本</text>
    </view>
    
    <!-- 表单区域 -->
    <view class="form-section">
      <!-- <text class="form-title">创建新账号</text> -->
      
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
          :rules="[{ required: true, message: '请输入密码' }, { min: 8, max: 20, message: '密码长度为8-20个字符' }, { pattern: /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,20}$/, message: '密码必须包含字母和数字' }]"
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
        
        <!-- 密码确认输入 -->
        <nut-form-item 
          label="确认密码" 
          prop="confirmPassword" 
          :rules="[{ required: true, message: '请确认密码' }, { validator: validateConfirmPassword }]"
        >
          <nut-input 
            v-model="formData.confirmPassword" 
            placeholder="请再次输入密码" 
            type="password" 
            clearable 
            maxlength="20"
            :show-password="showConfirmPassword"
            @click:show-password="showConfirmPassword = !showConfirmPassword"
          />
        </nut-form-item>
        
        <!-- 注册按钮 -->
        <view class="register-button">
          <nut-button 
            type="primary" 
            block 
            @click="handleRegister" 
            :loading="loading"
            :disabled="loading"
          >
            注册
          </nut-button>
        </view>
        
        <!-- 切换到登录页面 -->
        <view class="switch-page">
          <view class="switch-text">
            已有账号？
            <view class="switch-link" @click="navigateToLogin">立即登录</view>
          </view>
        </view>
      </nut-form>
    </view>
  </view>
  <nut-toast :msg="state.msg" v-model:visible="state.show" type="text" @closed="onClosed" :cover="state.cover" />
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import Taro from '@tarojs/taro';
import { register, RegisterParams } from '../../api/auth';
import './index.scss';

// 表单数据
const formData = reactive({
  username: '',
  password: '',
  confirmPassword: ''
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
const showConfirmPassword = ref(false);

// 加载状态
const loading = ref(false);

// 表单引用
const formRef = ref<any>(null);

// 密码确认验证
const validateConfirmPassword = (value: string) => {
  if (value !== formData.password) {
    return Promise.reject('两次输入的密码不一致');
  }
  return Promise.resolve();
};

const openToast = (type: 'success' | 'fail', msg: string, cover = false) => {
  state.show = true
  state.msg = msg
  state.type = type
  state.cover = cover
}
const onClosed = () => console.log('closed')

// 注册处理
const handleRegister = async () => {
  // 表单验证
  if (!formRef.value) return;
  
  const valid = await formRef.value.validate();
  if (!valid) return;
  
  // 设置加载状态
  loading.value = true;
  
  try {
    // 注册请求参数
    const params: RegisterParams = {
      username: formData.username,
      password: formData.password
    };
    
    // 发起注册请求
    await register(params);
    
    // 注册成功，跳转到登录页面
    Taro.redirectTo({
      url: '/pages/login/index'
    });
    
    openToast('success', '注册成功，请登录');
  } catch (error: any) {
    openToast('fail', error.message || '注册失败，请重试');
  } finally {
    // 关闭加载状态
    loading.value = false;
  }
};

// 跳转到登录页面
const navigateToLogin = () => {
  Taro.redirectTo({
    url: '/pages/login/index'
  });
};
</script>