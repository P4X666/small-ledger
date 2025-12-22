<template>
  <view class="container" :style="{ paddingTop: navigationBarHeight + 'px' }">
    <view class="header">
      <nut-button type="default" @tap="goBack" class="back-btn">
        <nut-icon name="arrow-left" size="18" color="#333" />
      </nut-button>
      <text class="title">创建攒钱目标</text>
      <view class="placeholder"></view>
    </view>
    
    <view class="content">
      <!-- 目标名称 -->
      <view class="form-field">
        <text class="field-label">目标名称</text>
        <input 
          v-model="newGoal.title" 
          placeholder="例如：旅行基金、购车计划"
          class="input"
        />
      </view>
      
      <!-- 目标金额 -->
      <view class="form-field">
        <text class="field-label">目标金额</text>
        <view class="amount-input-container">
          <text class="currency-symbol">¥</text>
          <input 
            v-model.number="newGoal.targetAmount" 
            type="digit" 
            placeholder="0.00"
            class="amount-input"
          />
        </view>
      </view>
      
      <!-- 目标期限 -->
      <view class="form-field">
        <text class="field-label">目标期限</text>
        <picker mode="selector" :range="periodOptions" :value="newGoal.periodIndex" @change="handlePeriodChange">
          <view class="period-picker">
            <nut-icon name="calendar" size="16" color="#666" class="picker-icon" />
            <text class="picker-text">{{ periodOptions[newGoal.periodIndex] }}</text>
          </view>
        </picker>
      </view>
      
      <!-- 目标描述 -->
      <view class="form-field">
        <text class="field-label">目标描述（可选）</text>
        <textarea 
          v-model="newGoal.description" 
          placeholder="描述一下您的目标..."
          class="textarea"
          auto-height
        ></textarea>
      </view>
    </view>
    
    <view class="footer">
      <button @tap="goBack" class="cancel-btn">
        <nut-icon name="close" size="16" color="#666" />
        取消
      </button>
      <button @tap="createGoal" class="confirm-btn" :disabled="!canCreateGoal">
        <nut-icon name="check" size="16" color="#fff" />
        确认创建
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGoalsStore } from '@/store/goals';
import type { GoalPeriod } from '@/store/goals';
import Taro, { useDidShow, useLoad } from '@tarojs/taro';
import { useNavigationBar } from '@/utils/navigation';
import './index.scss'

const { navigationBarHeight } = useNavigationBar();
// 使用目标状态管理
const goalsStore = useGoalsStore();

// 期限选项
const periodOptions = ['1个月', '3个月', '6个月', '1年'];

// 新目标表单数据
const newGoal = ref({
  title: '',
  targetAmount: 0,
  periodIndex: 0,
  description: ''
});

// 计算属性
const canCreateGoal = computed(() => {
  return newGoal.value.title.trim() && newGoal.value.targetAmount > 0;
});

// 方法
const handlePeriodChange = (event: any) => {
  newGoal.value.periodIndex = event.detail.value;
};

const getPeriodFromString = (periodString: string): GoalPeriod => {
  switch (periodString) {
    case '1个月': return 'month';
    case '3个月': return 'quarter';
    case '6个月': return 'half_year';
    case '1年': return 'year';
    default: return 'month';
  }
};

const calculateEndDate = (period: GoalPeriod): string => {
  const endDate = new Date();
  switch (period) {
    case 'month':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case 'quarter':
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case 'half_year':
      endDate.setMonth(endDate.getMonth() + 6);
      break;
    case 'year':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
  }
  return endDate.toISOString();
};

const createGoal = () => {
  if (!canCreateGoal.value) return;
  
  const selectedPeriod = periodOptions[newGoal.value.periodIndex];
  const periodType = getPeriodFromString(selectedPeriod);
  
  goalsStore.addGoal({
    title: newGoal.value.title.trim(),
    targetAmount: newGoal.value.targetAmount,
    description: newGoal.value.description.trim(),
    period: periodType,
    endDate: calculateEndDate(periodType)
  });
  
  Taro.showToast({
    title: '创建成功',
    icon: 'success',
    duration: 1500
  });
  
  // 返回上一页
  setTimeout(() => {
    goBack();
  }, 1500);
};

const goBack = () => {
  Taro.navigateBack();
};
useLoad(() => {
  console.log('onLoad')
})
useDidShow(() => {
  console.log('onShow')
})
</script>
