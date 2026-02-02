<template>
  <nut-navbar
    :title="isViewMode ? '目标详情' : '添加目标'"
    left-show
    @click-back="goBack"
    fixed
    placeholder
    safe-area-inset-top
    z-index="999"
    class="custom-navbar"
    :style="{ '--status-bar-height': statusBarHeight + 'px' }"
  ></nut-navbar>
  <view class="container">
    
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
      
      <!-- 当前金额 -->
      <view class="form-field">
        <text class="field-label">当前金额</text>
        <view class="amount-input-container">
          <text class="currency-symbol">¥</text>
          <input 
            v-model.number="newGoal.currentAmount" 
            type="digit" 
            placeholder="0.00"
            class="amount-input"
          />
        </view>
      </view>
      
      <!-- 目标期限 -->
      <view class="form-field">
        <view class="field-label">目标期限</view>
        <view class="period-picker" @tap="showCalendar = true">
          <Date size="16" color="#666" class="picker-icon" />
          <text class="picker-text">{{ newGoal.startDate }} 至 {{ newGoal.endDate }}</text>
        </view>
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
    
    <view class="footer safe-area">
      <button @tap="goBack" class="cancel-btn">
        <Close size="16" color="#666" class="close-icon" />
        取消
      </button>
      <button @tap="createGoal" class="confirm-btn" :disabled="!canCreateGoal">
        <Check size="16" color="#fff" class="check-icon" />
        确认创建
      </button>
    </view>
  </view>
  <nut-calendar
    v-model:visible="showCalendar"
    type="range"
    :default-value="[newGoal.startDate, newGoal.endDate]"
    :start-date="calendarRange[0]"
    :end-date="calendarRange[1]"
    @close="showCalendar = false"
    @choose="chooseDate"
    class="custom-calendar"
    z-index="99999"
    :first-day-of-week="1"
  >
  </nut-calendar>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Date, Close, Check } from '@nutui/icons-vue-taro';
import { useGoalsStore } from '@/store/goals';
import Taro, { useDidShow, useLoad } from '@tarojs/taro';
import { useNavigationBar } from '@/utils/navigation';
import { getToday, getThreeYearsLaterEnd, getHalfYearLaterEnd } from '@/utils/date';
import './index.scss'

const { statusBarHeight } = useNavigationBar();
// 使用目标状态管理
const goalsStore = useGoalsStore();

// 是否为查看模式
const isViewMode = ref(true);
// 显示日历
const showCalendar = ref(false);

const calendarRange = ref([getToday(), getThreeYearsLaterEnd(getToday())]);

// 新目标表单数据
const newGoal = ref({
  title: '',
  targetAmount: 0,
  currentAmount: 0,
  startDate: getToday(),
  endDate: getHalfYearLaterEnd(getToday()),
  description: ''
});

// 计算属性
const canCreateGoal = computed(() => {
  return newGoal.value.title.trim() && newGoal.value.targetAmount > 0;
});

const createGoal = () => {
  if (!canCreateGoal.value) return;
  
  goalsStore.addGoal({
    name: newGoal.value.title.trim(),
    targetAmount: newGoal.value.targetAmount,
    currentAmount: newGoal.value.currentAmount,
    description: newGoal.value.description.trim(),
    startDate: newGoal.value.startDate,
    endDate: newGoal.value.endDate
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
useLoad((params) => {
  const { id } = params;
  if (id) {
    const goal = goalsStore.getGoal(id);
    if (goal) {
      newGoal.value = {
        title: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        description: goal.description,
        startDate: goal.startDate,
        endDate: goal.endDate
      };
      isViewMode.value = false;
    }
  } else {
    isViewMode.value = true;
  }
});

useDidShow(() => {
  // 页面显示时的逻辑
});

// 日期选择处理
const chooseDate = (e: any) => {
  console.log('chooseDate', e);
};

</script>
